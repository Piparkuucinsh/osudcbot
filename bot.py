import os
import asyncpg
import discord
from discord.ext import commands, tasks
from discord.utils import get
from dotenv import load_dotenv, set_key
import aiohttp
import asyncio
from dateutil import parser
from datetime import datetime, timedelta, timezone
from rosu_pp_py import Calculator, Beatmap
import time

load_dotenv()
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
API_CLIENT_ID = os.getenv('API_CLIENT_ID') #osu api client id
API_CLIENT_SECRET = os.getenv('API_CLIENT_SECRET') #osu api client secret
SERVER_ID = int(os.getenv('SERVER_ID')) #discord server id
OSU_API_TOKEN = os.getenv('OSU_API_TOKEN')
BOT_CHANNEL_ID = int(os.getenv('BOT_CHANNEL_ID')) #private channel for admin commands

#postgresql database url
DATABASE_URL = os.getenv('DATABASE_URL')


class OsuApiV2():

    token = OSU_API_TOKEN
    session = aiohttp.ClientSession()


    async def refresh_token(self, client_id, client_secret):
        parameters = {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type':'client_credentials',
            'scope':'public'
            }
        async with self.session.post('https://osu.ppy.sh/oauth/token', data=parameters) as response:
            responsejson = await response.json()
            self.token = responsejson['access_token']
            set_key(key_to_set='OSU_API_TOKEN', value_to_set=self.token, dotenv_path='.env') #doesnt work


    async def get_user(self, name, mode, key):
        async with self.session.get(f'https://osu.ppy.sh/api/v2/users/{name}/{mode}', params={'key':key}, headers={'Authorization':f'Bearer {self.token}'}) as response:
            return await response.json()

    async def get_rankings(self, mode, type, country, cursor):
        async with self.session.get(f'https://osu.ppy.sh/api/v2/rankings/{mode}/{type}', params={'country':country, 'page':cursor}, headers={'Authorization':f'Bearer {self.token}'}) as response:
            return await response.json()

    async def get_scores(self, mode, osu_id, type, limit):
        async with self.session.get(f'https://osu.ppy.sh/api/v2/users/{osu_id}/scores/{type}', params={'mode': mode, 'limit': limit}, headers={'Authorization':f'Bearer {self.token}'}) as response:
            return await response.json()

    async def get_user_recent(self, osu_id):
        async with self.session.get(f'https://osu.ppy.sh/api/v2/users/{osu_id}/recent_activity', headers={'Authorization':f'Bearer {self.token}'}) as response:
            return await response.json()

    async def get_beatmap_score(self, mode, osu_id, beatmap_id, mods=''):
        async with self.session.get(f'https://osu.ppy.sh/api/v2/beatmaps/{beatmap_id}/scores/users/{osu_id}', params={'mode': mode, 'mods': mods}, headers={'Authorization':f'Bearer {self.token}'}) as response:
            return await response.json()
    


osuapi = OsuApiV2()


intents = discord.Intents.default()
intents.members = True
intents.message_content = True
intents.presences = True
bot = commands.Bot(intents=intents, command_prefix='!')

#@bot.command()
@tasks.loop(hours=12)
async def token_reset():
    ctx = bot.get_channel(BOT_CHANNEL_ID)
    await osuapi.refresh_token(client_id=API_CLIENT_ID, client_secret=API_CLIENT_SECRET)
    print('token reset')

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user} (ID: {bot.user.id})')
    print('------')

    print('Servers connected to:')
    for guild in bot.guilds:
        print(guild.name)

    global lvguild
    lvguild = bot.get_guild(SERVER_ID)

    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, ssl='require')

    token_reset.start()
    await asyncio.sleep(5)
    link_acc.start()
        

already_sent_messages = []

@tasks.loop(minutes=5)
#@bot.command()
#loops through every dc member and their activities, if it finds osu then uses the username in rich presence to get the user id from osu api.
#if the player isn't already linked in the database it links them. 
async def link_acc():
    try:
        ctx = bot.get_channel(BOT_CHANNEL_ID)
        async with pool.acquire() as db:
            for guild in bot.guilds:
                for member in guild.members:
                    if member.activities != None:
                        for osu_activity in member.activities:
                            try:
                                if osu_activity.application_id == 367827983903490050:         
                                    username = osu_activity.large_image_text.split('(', 1)[0].removesuffix(' ')
                                    if username == osu_activity.large_image_text:
                                        continue

                                    osu_user = await osuapi.get_user(name=username, mode='osu', key='username')

                                    if osu_user == {'error': None}:
                                        continue

                                    result = await db.fetch(f'SELECT discord_id, osu_id FROM players WHERE discord_id = {member.id} AND osu_id IS NOT NULL')

                                    if result == []:

                                        if osu_user['country_code'] == 'LV':
                                            result = await db.fetch(f'SELECT discord_id, osu_id FROM players WHERE osu_id = {osu_user["id"]};')
                                            if result == []:
                                                await db.execute(f'UPDATE players SET osu_id = {osu_user["id"]} WHERE discord_id = {member.id};')
                                                await ctx.send(f'Pievienoja {member.mention} datubāzei ar osu! kontu {osu_user["username"]} (id: {osu_user["id"]})', allowed_mentions = discord.AllowedMentions(users = False))
                                                #await refresh_user_rank(member)
                                                continue
                                            #check if discord multiaccounter
                                            if member.id != result[0][0]:
                                                await db.execute(f'UPDATE players SET osu_id = {osu_user["id"]} WHERE discord_id = {member.id};')
                                                await db.execute(f'UPDATE players SET osu_id = NULL WHERE discord_id = {result[0][0]};')
                                                await ctx.send(f'Lietotājs {member.mention} spēlē uz osu! konta (id: {osu_user["id"]}), kas linkots ar <@{result[0][0]}>. Vecais konts unlinkots un linkots jaunais.')
                                                #await refresh_user_rank(member)

                                        else:
                                            if member.get_role(539951111382237198) == None:
                                                await member.add_roles(get(lvguild.roles, id=539951111382237198))
                                                await ctx.send(f'Lietotājs {member.mention} nav no Latvijas! (Pievienots imigranta role)')

                                    else:
                                        print(f"{member.mention} jau eksistē datubāzē")

                                        #check if osu multiaccount (datbase osu_id != activity osu_id)
                                        print(result[0][1])
                                        if osu_user['id'] != result[0][1]:
                                            if (osu_user['id'], result[0][1]) not in already_sent_messages:
                                                #await ctx.send(f'Lietotājs {member.mention} jau eksistē ar osu! id {result[0][1]}, bet pašlaik spēlē uz cita osu! konta ar id = {osu_user["id"]}.')
                                                already_sent_messages.append((osu_user['id'], result[0][1]))
                                            else:
                                                continue

                            except AttributeError as ae:
                                if str(ae) == "'CustomActivity' object has no attribute 'application_id'" or "'Spotify' object has no attribute 'application_id'" or "'Game' object has no attribute 'application_id'" or "'Streaming' object has no attribute 'application_id'":
                                    continue
                                else:
                                    raise ae
                            except KeyError as ke:
                                if str(ke) == "'large_image_text'":
                                    continue
                                else:
                                    raise ke

                
        print('link acc finished')

    except Exception as e:
        print(repr(e))
        await ctx.send(f'{repr(e)} in link_acc')


#checks for users that are in the discord server but arent in the database.
@bot.command()
async def update_user(ctx):
    if ctx.channel.id != BOT_CHANNEL_ID:
        return
    async with pool.acquire() as db:
        result = await db.fetch("SELECT discord_id FROM players;")
        db_id_list = [x[0] for x in result]
        users = 'Pievienoja '
        pievienots = False
        for member in lvguild.members:
            if member.id not in db_id_list:
                await db.execute(f'INSERT INTO players (discord_id) VALUES ({member.id});')
                print(f'added {member.name} to database')
                users += f'{member.name}, '
                pievienots = True
        
        if pievienots == True:
            await ctx.send(f'{users.removesuffix(", ")} datubāzei.')
        if pievienots == False:
            await ctx.send(f'Nevienu nepievienoja datubāzei.')
        
bot.run(DISCORD_TOKEN)