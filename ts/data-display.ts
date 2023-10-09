import * as c3 from 'c3';
import {unpack} from 'msgpackr/unpack';

interface HourData {
	start: string,
	kWh: number,
	$: number,
}

function *iterMonths(start: string, end: string): Generator<string> {
	const date = new Date(start);
	const endDate = new Date(end);
	while (date < endDate) {
		yield date.toISOString().substring(0, 7);
		if (date.getMonth() < 11)
			date.setMonth(date.getMonth() + 1);
		else
			date.setFullYear(date.getFullYear() + 1, 0);
	}
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

async function generateChart(startDate: string, endDate: string) {
	const intervalData: HourData[] = [];
	for (const month of iterMonths(startDate, endDate)) {
		const monthData = await fetchData(month);
		if (!monthData)
			continue;
		monthData.forEach((hour) => {
			const parsedDataDate = hour.start.split('T')[0];
			if (parsedDataDate >= startDate && parsedDataDate <= endDate)
				intervalData.push(hour);
		});
	}

	c3.generate({
		'bindto': '#power-chart',
		'data': {
			'x': 'date',
			'xFormat': '%Y-%m-%dT%H:%M:%S%Z',
			'columns': [
				['date', ...intervalData.map(hour => hour.start)],
				['Power Usage (kWh)', ...intervalData.map(hour => hour.kWh)],
				['Cost ($)', ...intervalData.map(hour => hour.$)],
			],
		},
		'axis': {
			'x': {
				'type': 'timeseries',
				'tick': {
					'outer': false,
					'format': '%Y-%m-%d  %H:%M',
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
