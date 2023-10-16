#!/usr/bin/env python3

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

def main() -> None:
	if len(sys.argv) == 2 and sys.argv[1] == 'analyze':
		analyze()
	else:
		asyncio.run(download())

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
			print('will download', start.strftime('%Y-%m'))
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
	print('writing', out_path)
	out_path.write_bytes(ormsgpack.packb(data))

def analyze():
	intervals = sorted(iter_intervals(), key=lambda interval: interval['kWh'])
	p5 = len(intervals) // 20
	print(len(intervals), 'data points; 5th percentile is', p5)
	print(intervals[p5 + 1], 'kWh')

def iter_intervals() -> typing.Iterator[dict]:
	for path in DATA_DIR.iterdir():
		for interval in ormsgpack.unpackb(path.read_bytes()):
			yield interval

if __name__ == '__main__':
	main()
