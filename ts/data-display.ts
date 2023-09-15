import * as c3 from 'c3';
import {unpack} from 'msgpackr/unpack';

interface HourData {
	start: string,
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

async function generateChart(startDate?: string, endDate?: string) {
	const intervalData = await fetchData('2023-08');
	const testData = [];

	if (startDate && endDate) {
		intervalData.forEach((hour) => {
			const parsedDataDate = hour.start.split('T')[0];
			
			if  (parsedDataDate >= startDate && parsedDataDate <= endDate) {
				testData.push(hour);
			}
		});
	}

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
					'count': 6,
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
