import { auth } from "@/auth";
import { UserButton } from "@/components/auth/user-button";
import Balance from "@/components/balance";
import Link from "next/link";
import DepositButton from "./deposit-button";
import { SupportNotificationIndicator } from "@/components/support-notification-indicator";

const HeaderAuth = async () => {
    const session = await auth();
    const isBlocked = session?.user?.isBlocked;

    return (
        <div>
            {!session ? (
                <div className="flex gap-3 items-center sm:text-xl text-sm">
                    <Link href="login" className="border-2 border-white hover:border-gray-300 hover:text-gray-300 rounded-full sm:px-5 px-4 py-1 transition duration-300 ease-in-out">Log in</Link>
                    <Link href="register" className="bg-white text-black border-2 border-white hover:bg-gray-300 hover:border-gray-300 rounded-full sm:px-5 px-4 py-1 transition duration-300 ease-in-out">Sign up</Link>
                </div>
            ) : (
                <div className="flex items-center gap-4 font-bold">
                    {isBlocked ? (
                        <></>
                        ) : (
                        <DepositButton />
                    )}
                    <Balance />
                    <div className="hidden lg:block relative">
                        <UserButton />
                        <div className="absolute -top-0.5 right-1">
                            <SupportNotificationIndicator />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
 
export default HeaderAuth;