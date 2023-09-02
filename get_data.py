#!/usr/bin/env python3

import asyncio
import pathlib

import aiohttp

import opower


async def _main() -> None:
	CURRENT_DIR = pathlib.Path(__file__).parent
	username = 'rayllu'
	password = (CURRENT_DIR / 'password').read_text().rstrip()

	async with aiohttp.ClientSession() as session:
		client = opower.Opower(session, 'pge', username, password)
		await client.async_login()
		# re-login to make sure code handles already logged in sessions
		await client.async_login()

		(customer,) = await client._async_get_customers()
		customer_uuid = customer['uuid']
		url = f'https://pge.opower.com/ei/edge/apis/DataBrowser-v1/cws/utilities/pge/customers/{customer_uuid}/usage_export/download?format=csv&startDate=2023-08-01&endDate=2023-09-01'
		async with session.get(url, headers=client._get_headers(), raise_for_status=True) as resp:
			zip = await resp.read()
		with open('data.zip', 'wb') as f:
			f.write(zip)

asyncio.run(_main())
