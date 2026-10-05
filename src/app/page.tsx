import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Work from "@/components/Work";
import MoreProjects from "@/components/MoreProjects";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Capabilities from "@/components/Capabilities";
import OffTheClock from "@/components/OffTheClock";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Marquee />
        <Work />
        <MoreProjects />
        <About />
        <Experience />
        <Capabilities />
        <OffTheClock />
      </main>
      <Contact />
    </>
  );
}
