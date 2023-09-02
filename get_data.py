#!/usr/bin/env python3

import asyncio
import calendar
import csv
import datetime
import io
import pathlib
import zipfile

import aiohttp
import opower
import ormsgpack

CURRENT_DIR = pathlib.Path(__file__).parent
DATA_DIR = CURRENT_DIR / 'interval_data'

async def main() -> None:
	DATA_DIR.mkdir(exist_ok=True)
	start = datetime.date(2020, 10, 1)
	DATA_DIR.iterdir() # TODO

	username = 'rayllu'
	password = (CURRENT_DIR / 'password').read_text().rstrip()

	async with aiohttp.ClientSession() as session:
		client = opower.Opower(session, 'pge', username, password)
		await client.async_login()
		# re-login to make sure code handles already logged in sessions
		await client.async_login()

		(customer,) = await client._async_get_customers()
		customer_uuid: str = customer['uuid']

		await download(session, client, customer_uuid, datetime.date(2021, 1, 1))

async def download(session: aiohttp.ClientSession, client: opower.Opower, customer_uuid: str,
		start: datetime.date) -> None:
	end = start.replace(day=calendar.monthrange(start.year, start.month)[1])
	url = f'https://pge.opower.com/ei/edge/apis/DataBrowser-v1/cws/utilities/pge/customers/{customer_uuid}/usage_export/download?format=csv&startDate={start}&endDate={end}'
	async with session.get(url, headers=client._get_headers(), raise_for_status=True) as resp:
		zip = io.BytesIO(await resp.read())

	with zipfile.ZipFile(zip, 'r') as f:
		(filename,) = (name for name in f.namelist() if name.startswith('pge_electric_interval_data_'))
		contents = f.read(filename)

	csv_contents = contents.split(b'\n', 5)[5]
	csv_reader = csv.DictReader(line.decode() for line in csv_contents.split(b'\n'))
	readings = [float(row['USAGE']) for row in csv_reader]

	out_path = (DATA_DIR / f'{start.strftime("%Y-%m")}.msgpack')
	print('writing', out_path)
	out_path.write_bytes(ormsgpack.packb(readings))

asyncio.run(main())
