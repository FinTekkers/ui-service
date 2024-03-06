// import { redirect } from "@sveltejs/kit";
// import { OAuth2Client } from "google-auth-library";
// import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";


// async function getUserData(access_token:any) {

//   const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
//   console.log('response',response);
//   const data = await response.json();
//   console.log('data',data);
// }


// export const GET = async({url})=>{
// const redirectURL = 'http://localhost:5173/oauth';
// const code = url.searchParams.get('code')

//         try{

//             const oAuth2client = new OAuth2Client(
//                 GOOGLE_CLIENT_ID,
//                 GOOGLE_CLIENT_SECRET,
//                 redirectURL
//             )

//             const r = await oAuth2client.getToken(code)
//             oAuth2client.setCredentials(r.tokens)
//             const user = oAuth2client.credentials
//             console.log('credentials',user);

//             await getUserData(user.access_token);


//         }catch(error){

//         }

//         throw redirect(303,'/')

// }