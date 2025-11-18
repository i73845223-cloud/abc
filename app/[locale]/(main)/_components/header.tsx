import Link from "next/link";
import HeaderAuth from "./header-auth";
import HeaderNav from "./header-nav";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import LanguageSwitcher from "./language-switcher";

const montserrat = Montserrat({ subsets: ['latin'] })

const Header = () => {
    return (
        <header className="fixed flex justify-between items-center sm:px-8 px-3 py-2 text-xl border-b-2 border-red-600 w-full bg-black z-[20]">
            <Link href="/" className="flex gap-2 items-center text-3xl font-bold text-red-600">
                <Image
                    src="/logo.svg"
                    alt="logo"
                    width="35"
                    height="35"
                    priority
                />
                <div className={montserrat.className}>
                    <span className="hidden sm:inline">altbet</span>
                </div>
            </Link>
            <HeaderNav />
            <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <HeaderAuth />
            </div>
        </header>
    );
}
 
export default Header;