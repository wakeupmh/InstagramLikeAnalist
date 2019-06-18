const Instagram = require('node-instagram').default;
const express = require('express');

const instagram = new Instagram({
  clientId: '<yourClientID>',
  clientSecret: '<yourClientSecret>',
});

const redirectUri = 'http://localhost:3000/auth/instagram/callback';

const app = express();

app.get('/auth/instagram', (req, res) => {
  res.redirect(instagram.getAuthorizationUrl(redirectUri, { scope: ['public_content'] }));
});

app.get('/auth/instagram/callback', async (req, res) => {
  try {
    const response = await instagram.authorizeUser(req.query.code, redirectUri);
    res.json(response);
    const user = await instagram.get('users/self', { access_token: response.access_token }).then(result => {
       return {followers: result.data.counts.followed_by, userName: result.data.username, _id: result.data._id, img: result.data.profile_picture};
    });
    instagram.get('users/self/media/recent', { access_token: response.access_token }).then(result => {
        let recentPhoto = result.data[0].id;
        console.log(recentPhoto);
        let percent = result.data.map(x=>{
            return (parseInt(x.likes.count) / parseInt(user.followers)).toFixed(2);
        });
        let media = percent.reduce((total, valor) => total+valor/percent.length, 0);
        let variancia = percent.reduce((total, valor) => total + Math.pow(media - valor, 2)/percent.length, 0);
        let desvioPadrao = Math.sqrt(variancia);

        console.log(`######## @${user.userName} ##########\n`)
        console.log(`${(media*100).toFixed(2)}% dos seus seguidores em média curtiram suas fotos`);
        console.log(`Com uma variância de ${variancia.toFixed(4)} por curtida`);
        console.log(`E um desvio padrão de ${desvioPadrao.toFixed(4)}\n`);

    });
  } catch (err) {
    res.json(err); 
  }
});

app.listen(3000, () => {
  console.log('app listening on http://localhost:3000');
});
