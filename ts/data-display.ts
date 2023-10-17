import * as c3 from 'c3';
import {unpack} from 'msgpackr/unpack';

interface Data {
	baseload: number,
	intervalData: HourData[],
}

interface HourData {
	start: string,
	kWh: number,
	$: number,
	charging?: boolean,
}

enum Aggregation {
	Hourly,
	Daily,
}

function days(start: string, end: string): number {
	return (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60 / 60 / 24;
}

async function fetchData(): Promise<Data> {
	const resp = await fetch('interval_data.msgpack');
	if (!resp.ok)
		throw new Error('failed to fetch interval_data.msgpack');
	return unpack(new Uint8Array(await resp.arrayBuffer()));
}

const dataPromise = fetchData();

async function render(startDate: string, endDate: string) {
	const aggregation = days(startDate, endDate) <= 31 ? Aggregation.Hourly : Aggregation.Daily;
	const data = await dataPromise;

	const intervals: HourData[] = [];
	let interval: HourData = null;
	let total = 0, charging = 0, num15Mins = 0;
	for (const hour of data.intervalData) {
		const day = hour.start.split('T')[0];
		if (day < startDate || day > endDate)
			continue;
		if (aggregation == Aggregation.Hourly)
			intervals.push(hour);
		else if (interval === null)
			interval = {'start': day, 'kWh': hour.kWh, '$': hour.$};
		else if (interval.start == day) {
			interval.kWh += hour.kWh;
			interval.$ += hour.$;
		} else {
			intervals.push(interval);
			interval = {'start': day, 'kWh': hour.kWh, '$': hour.$};
		}

		total += hour.kWh;
		if (hour.charging)
			charging += hour.kWh - data.baseload;
		num15Mins++;
	}
	if (aggregation == Aggregation.Daily)
		intervals.push(interval);

	renderChart(aggregation, intervals);
	renderTable(total, data.baseload * num15Mins, charging);
}

function renderChart(aggregation: Aggregation, intervals: HourData[]) {
	c3.generate({
		'bindto': '#power-chart',
		'data': {
			'x': 'date',
			'xFormat': aggregation == Aggregation.Hourly ? '%Y-%m-%dT%H:%M:%S%Z' : '%Y-%m-%d',
			'columns': [
				['date', ...intervals.map(interval => interval.start)],
				['power usage (kWh)', ...intervals.map(interval => interval.kWh)],
			],
		},
		'axis': {
			'x': {
				'type': 'timeseries',
				'tick': {
					'outer': false,
					'format': aggregation == Aggregation.Hourly ? '%Y-%m-%d  %H:%M' : '%Y-%m-%d',
					'rotate': -45,
				},
			},
			'y': {
				'label': {
					'text': 'power usage (kWh)',
					'position': 'outer-middle',
				},
			},
		},
		'grid': {
			'y': {
				'show': true,
			},
		},
		'regions': [
			{
				'axis': 'x',
				'start': '2023-09-01T00:00:00Z',
				'end': '2023-09-04T15:00:00Z',
				'class': 'off-peak',
			},
		],
	});
}

const table = document.querySelector('table#power-table') as HTMLTableElement;
function renderTable(total: number, baseload: number, charging: number) {
	table.innerHTML = `
		<tr><td>total</td><td>${total.toLocaleString()}</td><td>kWh</td></tr>
		<tr><td>baseload</td><td>${baseload.toLocaleString()}</td><td>kWh</td></tr>
		<tr><td>charging</td><td>${charging.toLocaleString()}</td><td>kWh</td></tr>
		<tr><td>other</td><td>${(total - baseload - charging).toLocaleString()}</td><td>kWh</td></tr>
	`;
}

export default render;
