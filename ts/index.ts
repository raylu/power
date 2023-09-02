import * as c3 from 'c3';
import {unpack} from 'msgpackr/unpack';

async function fetchIntervalData(month: string): Promise<number[]> {
	const url = `interval_data/${month}.msgpack`;
	const resp = await fetch(url);
	if (!resp.ok)
		throw new Error('failed to fetch ' + url);
	return unpack(new Uint8Array(await resp.arrayBuffer()));
}

c3.generate({
	'bindto': '#chart',
	'data': {
		'columns': [
			['data1', ...await fetchIntervalData('2021-01')],
		],
	},
});
