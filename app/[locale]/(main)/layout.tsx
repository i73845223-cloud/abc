import Header from "./_components/header"
import LowerNav from "./_components/lower-nav"

const MainLayout = ({ children }: {children: React.ReactNode}) => {

  return (
    <>
        <Header />
        <main className="md:pt-[66px] pt-[50px]">
            {children}
        </main>
        <LowerNav />
    </>
  )
}

export default MainLayout;