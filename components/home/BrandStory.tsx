'use client';

export default function BrandStory() {

  return (
    <section className="relative bg-neutral-950 text-white py-32 overflow-hidden">
      {/* Elegant background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 lg:items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <div className="inline-block">
              <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                Our Philosophy
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />
            </div>

            <h2 className="text-4xl font-light tracking-wide leading-tight sm:text-5xl">
              Crafted for Excellence,<br />
              <span className="text-amber-400/90">Designed for You</span>
            </h2>

            <div className="space-y-6 text-neutral-300 leading-relaxed">
              <p className="text-base sm:text-lg">
                At Georgio Bandera, we believe that exceptional hair care is an art form. 
                Each product is meticulously formulated with premium ingredients, combining 
                time-honored techniques with cutting-edge innovation.
              </p>
              <p className="text-base sm:text-lg">
                Our commitment to quality extends beyond the bottle—we create experiences 
                that elevate your daily routine, transforming simple moments into rituals 
                of self-care and sophistication.
              </p>
            </div>

            {/* Values grid */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
              <div>
                <p className="text-xs font-light uppercase tracking-[0.3em] text-amber-400/60 mb-2">
                  Premium
                </p>
                <p className="text-sm text-neutral-400">
                  Only the finest ingredients
                </p>
              </div>
              <div>
                <p className="text-xs font-light uppercase tracking-[0.3em] text-amber-400/60 mb-2">
                  Professional
                </p>
                <p className="text-sm text-neutral-400">
                  Salon-grade formulations
                </p>
              </div>
              <div>
                <p className="text-xs font-light uppercase tracking-[0.3em] text-amber-400/60 mb-2">
                  Sustainable
                </p>
                <p className="text-sm text-neutral-400">
                  Ethically sourced materials
                </p>
              </div>
              <div>
                <p className="text-xs font-light uppercase tracking-[0.3em] text-amber-400/60 mb-2">
                  Effective
                </p>
                <p className="text-sm text-neutral-400">
                  Proven results you'll love
                </p>
              </div>
            </div>
          </div>

          {/* Right: Visual element */}
          <div className="relative">
            <div className="aspect-square relative">
              {/* Decorative frame */}
              <div className="absolute inset-0 border border-white/10">
                <div className="absolute top-0 left-0 h-16 w-16 border-t-2 border-l-2 border-amber-500/30" />
                <div className="absolute top-0 right-0 h-16 w-16 border-t-2 border-r-2 border-amber-500/30" />
                <div className="absolute bottom-0 left-0 h-16 w-16 border-b-2 border-l-2 border-amber-500/30" />
                <div className="absolute bottom-0 right-0 h-16 w-16 border-b-2 border-r-2 border-amber-500/30" />
              </div>
              
              {/* Content placeholder */}
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="inline-block h-1 w-24 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                  <p className="text-sm font-light tracking-wider text-neutral-400">
                    Brand Image Placeholder
                  </p>
                  <p className="text-xs text-neutral-500">
                    High-end product photography or brand imagery
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

