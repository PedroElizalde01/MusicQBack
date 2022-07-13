import {Request, Response} from 'express';
import {PrismaClient} from '@prisma/client'


const express = require("express")
const app = express()

const cors = require("cors")
const bodyParser = require("body-parser")
const SpotifyWebApi = require("spotify-web-api-node")

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

//get songs by queueId ASC
app.get("/:queueId/songs", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","http://localhost:3000")
    const queueId = req.params.queueId;
    const songs = await prisma.song.findMany({
        where:{
            queueId: queueId,
        },
        orderBy:{
            position:"asc",
        }
    });
    res.json(songs);
});

//get songs by queueId DESC
/*
app.get("/:queueId/songs", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","http://localhost:3000")
    const queueId = req.params.queueId;
    const songs = await prisma.song.findMany({
        where:{
            queueId: queueId,
        },
        orderBy:{
            position:"desc",
        }
    });
    res.json(songs);
});*/

//delete songs behind certain position
app.delete("/:queueId", async(req: Request, res: Response) => {
    const queueId = req.params.queueId;
    const position = req.body.position;
    const deletedSong = await prisma.song.deleteMany({
        where:{
            queueId:queueId,
            position:{
                lt: position,
            }
        }}
    );
    res.json(deletedSong);
});


//get songs by queueId orderBy Likes
app.get("/:queueId/likedSongs", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","http://localhost:3000")
    const queueId = req.params.queueId;
    const songs = await prisma.song.findMany({
        where:{
            queueId: queueId,
        },
        orderBy:{
            likes:"desc",
        }
    });
    res.json(songs);
});

//get songs by id order by Dislikes
app.get("//:queueId/dislikedSongs", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin","http://localhost:3000")
    const id = req.params.id;
    const song = await prisma.song.findMany({
        where:{
            id:id
        },
        orderBy:{
            dislikes:"desc" 
        }
    });
    res.json(song);
});


//like song
app.put("/:songId/like", async (req: Request, res: Response) => {
    const id = req.params.songId;
    const {oldLikes} = req.body;
    const likedSong = await prisma.song.update({
        where:{
            id:id
        },
        data:{ 
            likes: oldLikes+1
        }
    })
    res.json(likedSong);
});

//dislike song
app.put("/:songId/dislike", async (req: Request, res: Response) => {
    const id = req.params.songId;
    const {oldDislikes} = req.body;
    const dislikedSong = await prisma.song.update({
        where:{
            id:id
        },
        data:{ 
            dislikes: oldDislikes+1
        }
    })
    res.json(dislikedSong);
});

//move track up
app.put("/:songId/moveUp", async (req: Request, res: Response) => {
    const id = req.params.songId;
    const actualPosition = req.body.position
    const queueId = req.body.queueId
    const newPosition = actualPosition - 1;
    const downSong = await prisma.song.updateMany({
        where:{
            position: newPosition,
            queueId: queueId
        },
        data:{
            position:actualPosition
        },
    })
    const currentSong = await prisma.song.update({
        where:{
            id:id
        },
        data:{ 
            position: newPosition
        }
    })
    res.json([currentSong,downSong]);
});


//move track down
app.put("/:songId/moveDown", async (req: Request, res: Response) => {
    const id = req.params.songId;
    const actualPosition = req.body.position
    const queueId = req.body.queueId
    const newPosition = actualPosition + 1;
    const upSong = await prisma.song.updateMany({
        where:{
            queueId: queueId,
            position: newPosition,
        },
        data:{
            position:actualPosition
        },
    })
    const currentSong = await prisma.song.update({
        where:{
            id:id
        },
        data:{ 
            position: newPosition
        }
    })
    res.json([currentSong,upSong]);
});


//delete song
app.delete("/deleteSong/:id", async(req: Request, res: Response) => {
    const id = req.params.id;
    const deletedSong = await prisma.song.delete({
        where:{
            id:id
        }}
    );
    res.json(deletedSong);
});

//add song
app.post("/addSong", async (req: Request, res: Response) => {
    const {uri, title, artist, albumUrl, queueId, position, likes, dislikes} = req.body;
    const song = await prisma.song.create({
        data: {
            uri: uri,
            title: title,
            artist: artist,
            albumUrl: albumUrl,
            queueId: queueId,
            position: position,
            likes: likes,
            dislikes: dislikes,
        },
    });
    res.json(song)
});

//get last song added to certain queue
app.get('/:queueId/lastSong', async (req: Request, res: Response) => {
    const id = req.params.queueId;
    const lastSong = await prisma.song.findMany({
        where:{
            queueId:id
        },
        orderBy:{
            position: 'desc'
        }
    });
    res.json(lastSong[0])
})

//login with spotify
app.post("/login", async (req: Request, res: Response) => {
    console.log("Starting to save DJ in DATABASE")
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
        const queue = await prisma.queue.create({
            data:{ 
              userId: user.id,  
            },
        });
        res.json([user,queue])
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
      .then( async(data:{body: { access_token: string; refresh_token: string; expires_in: number; }; }) => {
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
  app.post("/queue=:id", async (req: Request, res: Response)=>{
    res.setHeader("Access-Control-Allow-Origin","*") 
    console.log("Starting to save Guest in DATABASE")
    const id = req.params.id;
    const spotifyApi = new SpotifyWebApi({
        redirectUri: process.env.REDIRECT_URI,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
      })

      spotifyApi
      .clientCredentialsGrant()
      .then( async(data: {body: { access_token: string; refresh_token: string; expires_in: number; }; }) => {
        const guest = await prisma.user.create({ 
            data:{
                accessToken: data.body.access_token,
                refreshToken: data.body.refresh_token,
            }
        });
        res.json({
          accessToken: guest.accessToken,
          queueId: id,
        })
      })
      .catch((err: String) => {
        console.log(err)
        res.sendStatus(400)
      })
  })

  app.get("/queue=:id", async (req: Request, res: Response) => {
    const id = req.params.id;
    const queue = await prisma.queue.findUnique({
        where:{
            id:id
        }
    })
    res.json(queue)
});
app.listen(3001,() => {
    console.log('SERVER RUNNING ON PORT 3001')
})