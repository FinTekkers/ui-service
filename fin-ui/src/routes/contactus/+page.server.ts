export const actions = {
    message: async ({request}:{request:Request})=>{
       try{

        const data = await request.formData();
        console.log(data.get('email'))
        for (const [key, value] of data.entries()) {
                console.log(`${key}: ${value}`);
            }

       }catch(error){

       }
    }
}