import * as c3 from 'c3';
import {unpack} from 'msgpackr/unpack';

interface HourData {
	start: string,
	kWh: number,
	$: number,
}

enum Aggregation {
	Hourly,
	Daily,
}

function *iterMonths(start: string, end: string): Generator<string> {
	const date = new Date(start);
	date.setDate(1);
	const endDate = new Date(end);
	while (date <= endDate) {
		yield date.toISOString().substring(0, 7);
		if (date.getMonth() < 11)
			date.setMonth(date.getMonth() + 1);
		else
			date.setFullYear(date.getFullYear() + 1, 0);
	}
}

function days(start: string, end: string): number {
	return (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60 / 60 / 24;
}

async function fetchData(month: string): Promise<HourData[]> {
	const url = `interval_data/${month}.msgpack`;
	const resp = await fetch(url);
	if (!resp.ok)
		throw new Error('failed to fetch ' + url);
	return unpack(new Uint8Array(await resp.arrayBuffer()));
}

async function generateChart(startDate: string, endDate: string) {
	const aggregation = days(startDate, endDate) <= 31 ? Aggregation.Hourly : Aggregation.Daily;
	const intervalData: HourData[] = [];
	for (const month of iterMonths(startDate, endDate)) {
		const monthData = await fetchData(month);
		if (!monthData)
			continue;
		let interval: HourData = null;
		for (const hour of monthData) {
			const day = hour.start.split('T')[0];
			if (day < startDate || day > endDate)
				continue;
			if (aggregation == Aggregation.Hourly)
				intervalData.push(hour);
			else if (interval === null)
				interval = {'start': day, 'kWh': hour.kWh, '$': hour.$};
			else if (interval.start == day) {
				interval.kWh += hour.kWh;
				interval.$ += hour.$;
			} else {
				intervalData.push(interval);
				interval = {'start': day, 'kWh': hour.kWh, '$': hour.$};
			}
		}
		if (aggregation == Aggregation.Daily)
			intervalData.push(interval);
	}

	c3.generate({
		'bindto': '#power-chart',
		'data': {
			'x': 'date',
			'xFormat': aggregation == Aggregation.Hourly ? '%Y-%m-%dT%H:%M:%S%Z' : '%Y-%m-%d',
			'columns': [
				['date', ...intervalData.map(interval => interval.start)],
				['Power Usage (kWh)', ...intervalData.map(interval => interval.kWh)],
				['Cost ($)', ...intervalData.map(interval => interval.$)],
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
