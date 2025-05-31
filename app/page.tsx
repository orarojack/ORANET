import WifiPackages from "@/components/wifi-packages"
import Header from "@/components/header"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-green-50 to-white">
      <Header />
      <WifiPackages />
    </main>
  )
}
