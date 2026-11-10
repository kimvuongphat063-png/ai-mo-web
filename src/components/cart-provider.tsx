/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import {License,licenseMultipliers,productBySlug} from "@/lib/store";
type Item={slug:string;license:License;quantity:number};
type Cart={items:Item[];add:(slug:string,license?:License)=>void;remove:(slug:string,license:License)=>void;clear:()=>void;detailed:{item:Item;product:NonNullable<ReturnType<typeof productBySlug>>;price:number}[]};
const Context=createContext<Cart|null>(null);
export function CartProvider({children}:{children:React.ReactNode}){const [items,setItems]=useState<Item[]>([]);const [ready,setReady]=useState(false);useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem("aimo-cart")||"[]"))}catch{}setReady(true)},[]);useEffect(()=>{if(ready)localStorage.setItem("aimo-cart",JSON.stringify(items))},[items,ready]);const add=(slug:string,license:License="personal")=>{const p=productBySlug(slug);if(!p||p.ownership!=="owned")return;setItems(old=>{const hit=old.find(x=>x.slug===slug&&x.license===license);return hit?old.map(x=>x===hit?{...x,quantity:x.quantity+1}:x):[...old,{slug,license,quantity:1}]})};const detailed=useMemo(()=>items.flatMap(item=>{const product=productBySlug(item.slug);return product&&product.ownership==="owned"?[{item,product,price:product.price*licenseMultipliers[item.license]*item.quantity}]:[]}),[items]);return <Context.Provider value={{items,add,remove:(s,l)=>setItems(x=>x.filter(i=>i.slug!==s||i.license!==l)),clear:()=>setItems([]),detailed}}>{children}</Context.Provider>}
export function useCart(){const value=useContext(Context);if(!value)throw new Error("useCart must be inside CartProvider");return value}

