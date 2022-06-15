import {Request, Response} from 'express';
import {PrismaClient} from '@prisma/client'


const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const SpotifyWebApi = require("spotify-web-api-node")

const app = express()
app.use(cors())
app.use(bodyParser.json())

const prisma = new PrismaClient();

//get all users
app.get("/getUsers", async (req: Request, res: Response) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

//get all queues
app.get("/getQueues", async (req: Request, res: Response) => {
    const queues = await prisma.queue.findMany();
    res.json(queues);
});

//get all songs
app.get("/getSongs", async (req: Request, res: Response) => {
    const songs = await prisma.song.findMany();
    res.json(songs);
});

//get user by ID
app.get("/userId/:id", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","http://localhost:3000")
    const id = req.params.id;
    const user = await prisma.user.findUnique({
        where:{
            id: id
        }
    });
    res.json(user);
});

//get queue by ID
app.get("/queueId/:id", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","http://localhost:3000")
    const id = req.params.id;
    const queue = await prisma.queue.findUnique({
        where:{
            id: id
        }
    });
    res.json(queue);
});

//get songs by queueId
app.get("/:queueId/songs", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","http://localhost:3000")
    const queueId = req.params.queueId;
    const songs = await prisma.song.findMany({
        where:{
            queueId: queueId,
        }
    });
    res.json(songs);
});

//get songs by uri
app.get("/songs/:uri", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","http://localhost:3000")
    const uri = req.params.uri;
    const song = await prisma.song.findMany({
        where:{
            uri: uri,
        }
    });
    res.json(song);
});

//like song
app.put("/:queueId/like", async (req: Request, res: Response) => {
    const {uri, queueId} = req.body;
    const likedSong = await prisma.song.updateMany({
        where:{
            uri: uri,
            queueId: queueId,
        },
        data:{ 
            likes: +1 //not working - Pedro
        }
    })
    res.json(likedSong);
});

//dislike song
app.put("/:queueId/dislike", async (req: Request, res: Response) => {
    const {uri, queueId} = req.body;
    const dislikedSong = await prisma.song.updateMany({
        where:{
            uri: uri,
            queueId: queueId,
        },
        data:{ 
            dislikes: +1 //not working - Pedro
        }
    })
    res.json(dislikedSong);
});

//delete song
app.delete("/:queueId/deleteSong", async(req: Request, res: Response) => {
    const queueId = req.params.queueId;
    const uri = req.body.uri;
    const deletedUser = await prisma.song.deleteMany({
        where:{
            uri: uri,
            queueId:queueId,
        }}
    );
    res.json(deletedUser);
});

//add song
app.post("/addSong", async (req: Request, res: Response) => {
    const {uri, queueId, likes, dislikes} = req.body;
    const song = await prisma.song.create({
        data: {
            uri: uri,
            queueId: queueId,
            likes: likes,
            dislikes: dislikes,
        },
    });
    res.json(song)
});

//login with spotify
app.post("/login", async (req: Request, res: Response) => {
      
    const code = req.body.code
    const spotifyApi = new SpotifyWebApi({
      redirectUri: process.env.REDIRECT_URI,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    })
  
    spotifyApi
      .authorizationCodeGrant(code)
      .then(async (data: {body: { access_token: string; refresh_token: string; expires_in: number; }; }) => {
        const user = await prisma.user.create({
            data:{
                accessToken: data.body.access_token,
                refreshToken: data.body.refresh_token,
                //fix expireIn - Pedro
            },
        });
        await prisma.queue.create({
            data:{ 
              userId: user.id,  
            },
        });
        res.json(user)
      })
      .catch(() => {
        res.sendStatus(400)
      })
  })

  //refresh spotify access_token & expiretime
  app.post("/refresh/:id", async (req: Request, res:Response) => {
    res.setHeader("Access-Control-Allow-Origin","*")
    const id = req.params.id;
    const refreshToken = req.body.refreshToken
    const spotifyApi = new SpotifyWebApi({
      redirectUri: process.env.REDIRECT_URI,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken,
    })
  
    spotifyApi
      .refreshAccessToken()
      .then( async(data: { body: { access_token: string; }; }) => {
        const user = await prisma.user.update({ 
            where:{
                id:id
            },
            data:{
                accessToken: data.body.access_token,
                
            }
        });
        res.json({
          accessToken: user.accessToken,
        })
      })
      .catch((err: String) => {
        console.log(err)
        res.sendStatus(400)
      })
  })

  //guest login (anon)
  app.post("/guest", async (req: Request, res: Response)=>{
    res.setHeader("Access-Control-Allow-Origin","*") 
    const guest = await prisma.user.create({
        data:{ 
            accessToken:null,
            refreshToken:null,
        }
    })
    res.json(guest)
  })




app.listen(3001,() => {
    console.log('SERVER RUNNING ON PORT 3001')
})