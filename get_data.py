#!/usr/bin/env python3

import argparse
import asyncio
import calendar
import datetime
import pathlib
import sys
import typing

import aiohttp
import opower
import ormsgpack

CURRENT_DIR = pathlib.Path(__file__).parent
DATA_DIR = CURRENT_DIR / 'interval_data'

quiet = False

def main() -> None:
	global quiet
	parser = argparse.ArgumentParser()
	parser.add_argument('mode')
	parser.add_argument('-q', '--quiet', action='store_true')
	args = parser.parse_args()
	quiet = args.quiet

	if args.mode == 'analyze':
		analyze()
	elif args.mode == 'download':
		asyncio.run(download())
	else:
		sys.exit('mode must be one of "analyze" or "download"')

def log(*args) -> None:
	if not quiet:
		print(*args)

async def download() -> None:
	DATA_DIR.mkdir(exist_ok=True)
	try:
		last_file = sorted(DATA_DIR.iterdir())[-1]
		# redownload the last month rather than advancing a month because it's usually incomplete
		start = datetime.datetime.strptime(last_file.name.removesuffix('.msgpack'), '%Y-%m').date()
	except IndexError:
		start = datetime.date(2020, 10, 1)

	username = 'rayllu'
	password = (CURRENT_DIR / 'password').read_text().rstrip()
	today = datetime.date.today()

	async with aiohttp.ClientSession() as session:
		client = opower.Opower(session, 'pge', username, password)
		await client.async_login()
		# re-login to make sure code handles already logged in sessions
		await client.async_login()

		(account,) = [a for a in await client.async_get_accounts() if a.meter_type == opower.MeterType.ELEC]

		tasks = []
		while start < today:
			log('will download', start.strftime('%Y-%m'))
			tasks.append(download_month(client, account, start))
			start = (start + datetime.timedelta(days=31)).replace(day=1)
		await asyncio.gather(*tasks)

async def download_month(client: opower.Opower, account: opower.Account, start: datetime.date) -> None:
	end = start.replace(day=calendar.monthrange(start.year, start.month)[1])

	reads = await client.async_get_cost_reads(account, opower.AggregateType.HOUR,
			start_date=datetime.datetime(start.year, start.month, start.day),
			end_date=datetime.datetime(end.year, end.month, end.day))
	data = [{'start': r.start_time, 'kWh': r.consumption, '$': r.provided_cost} for r in reads]

	out_path = (DATA_DIR / f'{start.strftime("%Y-%m")}.msgpack')
	log('writing', out_path)
	out_path.write_bytes(ormsgpack.packb(data))

def analyze():
	intervals = list(iter_intervals())

	sorted_intervals = sorted(intervals, key=lambda interval: interval['kWh'])
	p5_index = len(sorted_intervals) // 20
	log(len(sorted_intervals), 'data points; 5th percentile is', p5_index)
	p5 = sorted_intervals[p5_index + 1]
	log(f"{p5['start']}\t{p5['kWh']} kWh\n")

	for i, interval in enumerate(intervals):
		date, time = interval['start'].split('T', 1)
		hour = time.split(':', 1)[0]
		if hour == '01' and interval['kWh'] > 4.5:
			if intervals[i-1]['kWh'] > interval['kWh'] * 2/3:
				log(f'charging on {date} including at 00:15')
				intervals[i-1]['charging'] = True
			else:
				log(f'charging on {date} but not at 00:15')
		if hour < '12' and interval['kWh'] > 4.5:
			interval['charging'] = True

	out_path = (CURRENT_DIR / 'interval_data.msgpack')
	log('\nwriting', out_path)
	out_path.write_bytes(ormsgpack.packb({
		'baseload': p5['kWh'],
		'intervalData': intervals,
	}))

def iter_intervals() -> typing.Iterator[dict]:
	for path in sorted(DATA_DIR.iterdir()):
		for interval in ormsgpack.unpackb(path.read_bytes()):
			yield interval

if __name__ == '__main__':
	main()
