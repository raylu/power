import * as c3 from 'c3';
import {unpack} from 'msgpackr/unpack';

interface HourData {
	start: string,
	kWh: number,
	$: number,
}

function getMonthRange(startDate: string, endDate?: string) {
	const months = [];
	const date1 = new Date(startDate);
	const date2 = new Date(endDate);
	const monthDiff = date2.getMonth() - date1.getMonth() + (date2.getFullYear() - date1.getFullYear()) * 12;
	months.push(date1.toLocaleDateString('sv').slice(0,7));

	if (monthDiff > 0) {
		for (let i = 0; i < monthDiff; i++) {
			date1.setMonth(date1.getMonth() + 1, 1);
			months.push(date1.toLocaleDateString('sv').slice(0,7));
		}
	}

	return months;
}

async function fetchData(month: string): Promise<HourData[]> {
	const url = `interval_data/${month}.msgpack`;
	try {
		const resp = await fetch(url);
		if (!resp.ok)
			throw new Error('failed to fetch ' + url);
		return unpack(new Uint8Array(await resp.arrayBuffer()));
	} catch(error) {
		console.log(error);
	}
}

async function generateChart(startDate?: string, endDate?: string) {
	let intervalData = [];
	const monthRange = getMonthRange(startDate, endDate);
	for (const month in monthRange) {
		const monthData = await fetchData(monthRange[month]);
		if (monthData) {
			intervalData = intervalData.concat(monthData);	
		}
	}

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
