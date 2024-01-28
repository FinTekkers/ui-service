import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, test } from 'vitest';
import FooterSection_SvelteComponent_ from './src/components/FooterSection.svelte';



describe('Footer', ()=>{
    beforeEach(()=>{
             render(FooterSection_SvelteComponent_);
    })
    test('elements must appear correctly, and urls must navigate', ()=>{
        
        const Contact = screen.getByRole('link', {name:'Contact info'});
        const Aboutus = screen.getByRole('link', {name:'About us'});
        const Home = screen.getByRole('link', {name:'Home'});
        const Ledger = screen.getByRole('link', {name:'Github Ledger Models'});
        const CodeExamples = screen.getByRole('link', {name:'Code Examples'});
        const Support = screen.getByRole('link', {name:'Support'});
        [Contact,Aboutus, Home, Ledger, CodeExamples, Support].forEach((el)=>{
           expect(el).toBeInTheDocument()
        })
    })
})




