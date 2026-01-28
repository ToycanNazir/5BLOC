import "./App.css";
import { Web3Provider } from "./contexts/Web3Context";
import { MessageProvider } from "./contexts/MessageContext";
import Header from "./components/Header";
import MessageBanner from "./components/MessageBanner";
import CardGrid from "./components/CardGrid";
import AdminPanel from "./components/AdminPanel";
import TransferCard from "./components/TransferCard";
import ExchangeSection from "./components/ExchangeSection";
import SearchCard from "./components/SearchCard";
import Footer from "./components/Footer";

export default function App() {
  return (
    <Web3Provider>
      <MessageProvider>
        <div className="container">
          <Header />
          <MessageBanner />
          <main>
            <CardGrid />
            <AdminPanel />
            <TransferCard />
            <ExchangeSection />
            <SearchCard />
          </main>
          <Footer />
        </div>
      </MessageProvider>
    </Web3Provider>
  );
}