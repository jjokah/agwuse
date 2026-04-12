import Image from "next/image";
import Link from "next/link";
import { CHURCH_INFO, WEEKLY_ACTIVITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CalendarDays, HeartHandshake, BookOpen, Users, ArrowRight, PlayCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden lg:pb-8 bg-background px-4">
        {/* Background Image Placeholder */}
        <div
          className="absolute inset-0 z-0 opacity-15 dark:opacity-20 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2000&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
        />
        {/* Background Decorative Blob & Gradient */}
        <div className="absolute inset-0 bg-background/60 z-0" />
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[100px] z-0" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-secondary/20 blur-[100px] z-0" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Image
            src="/ag-logo.png"
            alt="AG Wuse Church Logo"
            width={80}
            height={80}
            className="drop-shadow-lg"
            priority
          />

          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6 backdrop-blur-sm">
            {CHURCH_INFO.tagline}
          </div>

          <h1 className="mb-6 font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
            Welcome <span className="text-primary italic">Home</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
            {CHURCH_INFO.name} is a vibrant community of believers. We welcome you to join us as we worship, love, and grow together in faith.
          </p>

          <div className="flex flex-col items-center gap-4 w-full sm:w-auto sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full text-base shadow-[0_4px_14px_0_var(--color-primary)] hover:-translate-y-1 transition-all">
              <Link href="/about" className="flex items-center justify-center">
                Plan a Visit <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full text-base backdrop-blur-sm hover:-translate-y-1 transition-all">
              <Link href="/live" className="flex items-center justify-center">
                <PlayCircle className="mr-2 w-4 h-4" /> Watch Live
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Service Times Ribbon */}
      <section className="relative z-20 -mt-10 mb-16 px-4">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-lg shadow-xl">
          <div className="flex flex-col lg:flex-row items-center justify-between p-6 md:p-8 gap-6 lg:gap-10">
            <div className="shrink-0 text-center lg:text-left mb-2 lg:mb-0">
              <h3 className="font-serif text-3xl font-semibold text-primary">Service Times</h3>
              <p className="text-sm text-muted-foreground mt-1">Join us in person or online</p>
            </div>

            <div className="h-px w-full lg:h-16 lg:w-px bg-border/50"></div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-1 lg:flex-wrap lg:justify-start lg:gap-x-10 w-full">
              {WEEKLY_ACTIVITIES.map((activity) => (
                <div key={activity.day} className="flex flex-col items-center lg:w-1/5 lg:items-start group bg-background/40 lg:bg-transparent rounded-lg p-4 lg:p-0 border border-border/30 lg:border-transparent text-center lg:text-left w-full h-full justify-center">
                  <span className="text-primary text-[11px] sm:text-xs uppercase tracking-wider font-bold mb-1.5">{activity.day}</span>
                  <span className="text-foreground font-medium group-hover:text-primary transition-colors text-sm sm:text-base leading-tight mb-0.5">{activity.activity}</span>
                  <span className="text-muted-foreground font-normal text-xs sm:text-sm">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Bento Grid */}
      <section className="px-4 py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="mb-4 font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Connect With Us
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Discover ways to grow, serve, and give in our community.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Join Us Card - Large */}
            <Card className="lg:col-span-2 group relative overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg min-h-[300px]">
              {/* Image Placeholder */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent z-10" />
                <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop" alt="Small group" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              </div>

              <CardHeader className="relative z-20 h-full flex flex-col justify-end p-8 text-white">
                <Users className="w-12 h-12 text-primary-foreground mb-4 drop-shadow-md" />
                <CardTitle className="text-3xl font-serif mb-2">Join the Family</CardTitle>
                <CardDescription className="text-white/80 text-base mb-6 max-w-md">
                  Become a member and grow in fellowship with us. Find a small group, serve on a team, and discover your purpose.
                </CardDescription>
                <div>
                  <Button asChild variant="default" className="rounded-full shadow-[0_4px_14px_0_var(--color-primary)]">
                    <Link href="/join">Get Connected</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Give Card */}
            <Card className="group relative overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-h-[300px]">
              <CardHeader className="p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <HeartHandshake className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-serif mb-3">Give Online</CardTitle>
                  <CardDescription>
                    Support the work of God through tithes, offerings, and donations.
                  </CardDescription>
                </div>
                <Button asChild variant="outline" className="w-full mt-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Link href="/give">Give Now</Link>
                </Button>
              </CardHeader>
            </Card>

            {/* Sermons Card */}
            <Card className="group relative overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-h-[300px]">
              {/* Image Placeholder */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/60 z-10 group-hover:bg-black/40 transition-colors duration-500" />
                <img src="https://images.unsplash.com/photo-1473181440664-969c3aeb1a64?q=80&w=800&auto=format&fit=crop" alt="Sermon thumbnail" className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-700" />
              </div>

              <CardHeader className="relative z-20 p-8 h-full flex flex-col justify-between text-white">
                <div>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center mb-6">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-serif mb-3">Latest Sermons</CardTitle>
                  <CardDescription className="text-white/80">
                    Catch up on recent messages and teachings from our pastoral team.
                  </CardDescription>
                </div>
                <Link href="/sermons" className="w-full block mt-6">
                  <Button variant="outline" className="w-full flex justify-start bg-transparent border-white/50 text-white hover:bg-white hover:text-black transition-all">
                    <span>Watch Now</span> <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
            </Card>

            {/* Prayer Request Card - Wide */}
            <Card className="md:col-span-2 lg:col-span-2 group relative overflow-hidden bg-primary text-primary-foreground hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
                <HeartHandshake className="w-48 h-48" />
              </div>
              <CardHeader className="relative z-10 p-8 lg:p-10 h-full flex flex-col justify-center">
                <CardTitle className="text-3xl lg:text-4xl font-serif mb-4 flex items-center gap-3">
                  Need Prayer?
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 text-lg max-w-lg mb-8">
                  We believe in the power of prayer. Our intercessory team is ready to stand with you in faith.
                </CardDescription>
                <div>
                  <Button asChild variant="secondary" className="rounded-full px-8 text-secondary-foreground hover:-translate-y-1 transition-all">
                    <Link href="/prayer-request">Submit a Request</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
