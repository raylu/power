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

async function displayChart() {
	c3.generate({
		'bindto': '#chart',
		'data': {
			'columns': [
				['data1', ...(await fetchData('2023-08')).map(hour => hour.kWh)],
			],
		},
	});
}

export default displayChart;
