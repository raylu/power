import * as c3 from 'c3';
import {unpack} from 'msgpackr/unpack';

interface HourData {
	start: Date,
	kWh: number,
	$: number,
}

async function fetchData(month: string): Promise<HourData[]> {
	const url = `interval_data/${month}.msgpack`;
	const resp = await fetch(url);
	if (!resp.ok)
		throw new Error('failed to fetch ' + url);
	return unpack(new Uint8Array(await resp.arrayBuffer()));
}

async function generateChart() {
	const testData = await fetchData('2023-08');

	c3.generate({
		'bindto': '#power-chart',
		'data': {
			'x': 'date',
			'xFormat': '%Y-%m-%dT%H:%M:%S%Z',
			'columns': [
				['date', ...testData.map(hour => hour.start)],
				['Power Usage (kWh)', ...testData.map(hour => hour.kWh)],
				['Cost ($)', ...testData.map(hour => hour.$)],
			],
		},
		'axis': {
			'x': {
				'type': 'timeseries',
				'tick': {
					'format': '%Y-%m-%d',
				},
			},
		},
	});
}

export default generateChart;
