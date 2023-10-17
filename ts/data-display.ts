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

async function generateChart(startDate: string, endDate: string) {
	const aggregation = days(startDate, endDate) <= 31 ? Aggregation.Hourly : Aggregation.Daily;
	const data = await dataPromise;

	const intervals: HourData[] = [];
	let interval: HourData = null;
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
	}
	if (aggregation == Aggregation.Daily)
		intervals.push(interval);

	c3.generate({
		'bindto': '#power-chart',
		'data': {
			'x': 'date',
			'xFormat': aggregation == Aggregation.Hourly ? '%Y-%m-%dT%H:%M:%S%Z' : '%Y-%m-%d',
			'columns': [
				['date', ...intervals.map(interval => interval.start)],
				['Power Usage (kWh)', ...intervals.map(interval => interval.kWh)],
				['Cost ($)', ...intervals.map(interval => interval.$)],
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
					'text': 'Power Usage (kWh)',
					'position': 'outer-middle',
				},
			},
			'y2': {
				'show': true,
				'label': {
					'text': 'Cost ($)',
					'position': 'outer-middle',
				},
			},
		},
		'grid': {
			'y': {
				'show': true,
			},
		},
	});
}

export default generateChart;
