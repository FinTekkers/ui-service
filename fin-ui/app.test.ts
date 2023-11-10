import { describe, expect, test} from "vitest";
import { render, fireEvent } from '@testing-library/svelte';
import LandingSection__SvelteComponent_ from './src/components/LandingSection.svelte';



// @ts-ignore
describe('about section appears correctly', ()=>{

    test('testing the about section', async ()=>{

        const {getByText, getByRole} = render(LandingSection__SvelteComponent_)
        const fastText = getByText(/Fast/i)
        // expect(fastText).toBeInTheDocument()
        
    })

    
})