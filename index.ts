import {Request, Response} from 'express';
import {PrismaClient} from '@prisma/client'

require("dotenv").config()
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const SpotifyWebApi = require("spotify-web-api-node")

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());

const prisma = new PrismaClient();

app.post("/", async (req: Request, res: Response) => {
    const {accessToken, refreshToken, expireTime} = req.body;
    const user = await prisma.user.create({
        data: {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expireTime: Number(expireTime),
        },
    });
    res.json(user)
});

app.get("/", async (req: Request, res: Response) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

app.get("/getQueues", async (req: Request, res: Response) => {
    const users = await prisma.queue.findMany();
    res.json(users);
});

app.get("/byId/:id", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","http://localhost:3000")
    const id = req.params.id;
    const user = await prisma.user.findUnique({
        where:{
            id: id
        }
    });
    res.json(user);
});

app.put("/", async (req: Request, res: Response) => {
    const {id, accessToken} = req.body
    const updateUser = await prisma.user.update({ 
        where: {
            id: id,
        },
        data: {
            accessToken: accessToken,
        }
    })
    res.json(updateUser);
});

app.delete("/:id", async(req: Request, res: Response) => {
    const id = req.params.id;
    const deletedUser = await prisma.user.delete({
        where:{
            id: id,
        }}
    );
    res.json(deletedUser);
});

//app.post("/", async (req: Request, res: Response) => {
//    const {accessToken, refreshToken, expireTime} = req.body;
//    const user = await prisma.user.create({
//        data: {
//            accessToken: accessToken,
//            refreshToken: refreshToken,
//            expireTime: Number(expireTime),
//            Queue: {
//                create: {
//                    userId: '',
//                },
//            },
//        },
//    });
//    res.json(user)
//});

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

app.post("/login", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","*")    
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
                
            },
        });
        const queue = await prisma.queue.create({
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

  app.post("/refresh", (req: Request, res:Response) => {
    res.setHeader("Access-Control-Allow-Origin","*")    
    const refreshToken = req.body.refreshToken
    const spotifyApi = new SpotifyWebApi({
      redirectUri: process.env.REDIRECT_URI,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken,
    })
  
    spotifyApi
      .refreshAccessToken()
      .then((data: { body: { accessToken: String; expiresIn: any; }; }) => {
        res.json({
          accessToken: data.body.accessToken,
          expiresIn: data.body.expiresIn,
        })
      })
      .catch((err: String) => {
        console.log(err)
        res.sendStatus(400)
      })
  })

app.listen(3001,() => {
    console.log('SERVER RUNNING ON PORT 3001')
})