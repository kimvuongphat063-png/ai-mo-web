"use client";
import Link from "next/link"; import { useEffect,useState } from "react"; import { useRouter } from "next/navigation";
type User={name:string;role:"admin"|"learner"};
export function AuthNav(){const [user,setUser]=useState<User|null>(null);const router=useRouter();useEffect(()=>{fetch("/api/auth/session").then(r=>r.ok?r.json():null).then(x=>setUser(x?.user??null))},[]);if(!user)return <Link href="/login" className="text-link">Đăng nhập</Link>;const href=user.role==="admin"?"/admin":"/account/learning";return <><Link href={href} className="text-link">{user.role==="admin"?"Quản trị":"Việc học"}</Link><button className="nav-logout" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});setUser(null);router.push("/");router.refresh()}}>Đăng xuất</button></>}
