import { render, fireEvent, screen } from '@testing-library/svelte';
import LandingSection__SvelteComponent_ from './src/components/LandingSection.svelte';
import FooterSection_SvelteComponent_ from './src/components/FooterSection.svelte';
import {afterEach, beforeEach, describe, expect, it, test,} from 'vitest';
import userEvent from '@testing-library/svelte';

describe('landing section', ()=>{
    test('landing section renders', ()=>{
        render(FooterSection_SvelteComponent_);
        const Contact = screen.getByText('Contact Info');
        const Aboutus = screen.getByText('About us');
        [Contact,Aboutus].forEach((el)=>{
           expect(el).toBeInTheDocument()
        })
        fireEvent.click(Aboutus);
        expect(Aboutus).toBeInTheDocument()


    })
})



// // @ts-ignore
// describe('about section appears correctly', ()=>{

//     test('testing the about section', async ()=>{

//         const {getByText, getByRole} = render(LandingSection__SvelteComponent_)
//         const fastText = getByText(/Fast/i)
//         // expect(fastText).toBeInTheDocument()
        
//     })

    
// })

// import LandingSection__SvelteComponent_  from './src/components/LandingSection.svelte';

// describe("testing components", () => {
//     let instance = null;

//     beforeEach(() => {
//         //create instance of the component and mount it
//         // instance = new LandingSection({
//         //     target:document.body
//         // });
//     })

  

//      afterEach(() => {
//         // Destroy/unmount the instance after each test
//         // instance.$destroy();
//     });

//     test("that LandingSection is rendered", () => {
//         expect(1+2).toBe(3);
//     })

// })