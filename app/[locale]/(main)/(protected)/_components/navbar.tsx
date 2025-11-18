"use client"

import Link from "next/link"
import { UserButton } from "@/components/auth/user-button"

const Navbar = () => {
    return (
        <nav className="fixed w-screen flex justify-between items-center p-4 border-b-2 border-indigo-600 bg-black">
            <div className="text-2xl text-indigo-400">
                <Link href='/'>
                    sbh
                </Link>
            </div>
            <UserButton />
        </nav>
    );
}
 
export default Navbar;