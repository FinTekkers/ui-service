import { fail, redirect } from "@sveltejs/kit";
import * as Yup from 'yup';

const signInSchema = Yup.object({
    searchQuery:Yup.string().min(3,'please enter a word').required('please enter text'),
})

export const actions = {
    search: async ({request}:{ request: Request })=>{
      
        try{
               const data = await request.formData();
               const searchQuery = data.get('search');
               console.log('search query', searchQuery);
        }catch(error){
            console.log('something went wrong', error)
        }


    }
}