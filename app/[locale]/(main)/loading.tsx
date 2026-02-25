import Image from "next/image";

export default function Loading() {
    return (
        <div className="flex justify-center items-center h-full w-full bg-black fixed z-[999] top-0">
            <Image
                width={250}
                height={250}
                src="/logo.svg"
                alt="Logo"
                className="bg-black animate-pulse sm:max-w-[250px] max-w-[40%]"
            />
        </div>
    )
}