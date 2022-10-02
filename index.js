const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const app = express()
const port = 3000


app.use(cors())
app.get('/', (req, res) => {
  res.send({message: 'Hello World!'})
})

app.get('/crawl', async (req, res) => {
  const data = await crawl({ url: `${req.query.url}`})
  res.send({ siteMap: data }) 
  
})

const seenLinks = new Set()
const siteMap = []

const crawl = async({ url }) =>{
  const response = await fetch(url)
                        .then(resp => resp, err => console.error(err))
  const html = await response.text()
  const $ = cheerio.load(html)
  const origin = new URL(url).origin
  if(!seenLinks.has(url))
    seenLinks.add(url)

  const links = $('a') 
  .map( (i, link) => {

    if(!!link.attribs.href
      &&!link.attribs.href.includes('/')) return origin+'/'+link.attribs.href
    return (!link.attribs.href
    || !link.attribs
    || link.attribs.href.includes('http'))?'': origin+link.attribs.href
  })
  .get()

  links
  .filter(link => link.includes(origin))
  .filter(link => !seenLinks.has(link))
  .forEach(link => {
    if(!seenLinks.has(link)) { 
    
      //Static assets
      const images = $('img') 
      .map( (i, link) => link.attribs.src).get()
      //Populate site map
      siteMap.push({
        page: link,
        imageLinks: images
      })

      const audioSrc = $('audio') 
      .map( (i, link) => link.attribs.src).get()
      //Populate site map
      if(audioSrc.length > 0)
        siteMap.push({
          page: link,
          audio: audioSrc
        })

      // //recursively call
      //   crawl({ url: link })
      }
    })

  return siteMap

}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})