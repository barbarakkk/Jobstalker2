import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Chrome, Download, Zap, Bookmark, Link2, CheckCircle, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Bookmark,
    title: 'One-Click Save',
    description: 'Save jobs from LinkedIn directly to your dashboard',
  },
  {
    icon: Link2,
    title: 'AI Extraction',
    description: 'Automatically extracts job details with AI',
  },
  {
    icon: Zap,
    title: 'Auto-Sync',
    description: 'All jobs sync automatically to your dashboard',
  },
];

export function ChromeExtension() {
  const handleChromeStore = () => {
    window.open('https://chrome.google.com/webstore', '_blank');
  };

  return (
    <section className="relative w-full py-24 lg:py-32 overflow-hidden bg-white">
      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <Badge className="px-4 py-1.5 bg-blue-50 text-blue-700 border-blue-200">
              <Chrome className="w-3.5 h-3.5 mr-2" />
              Chrome Extension
            </Badge>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-blue-900 leading-tight">
              Save Jobs{' '}
              <span className="text-blue-900">
                Instantly
              </span>
            </h2>
            
            <p className="text-xl text-blue-800/90 leading-relaxed">
              Download our free Chrome extension to save job postings directly from LinkedIn. Our AI automatically extracts all details and syncs them to your dashboard.
            </p>

            {/* Features List */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-800 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-1">{feature.title}</h3>
                      <p className="text-blue-800/80">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handleChromeStore}
                size="lg"
                className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Extension
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            {/* Trust Badge */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Free to use • No credit card required</span>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <Card className="overflow-hidden border-2 border-gray-100 shadow-2xl bg-white">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 flex items-center gap-3 border-b">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white rounded-lg px-4 py-2 text-sm text-gray-500 border border-gray-200">
                  linkedin.com/jobs/view/...
                </div>
              </div>
              
              <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                      <Bookmark className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Save to JobStalker AI</div>
                      <div className="text-sm text-gray-600">Senior Developer at TechCorp</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className="text-sm font-semibold text-gray-900">Bookmarked</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 mb-2">Excitement Level</div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-4 h-4 rounded ${i < 4 ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white shadow-lg">
                    <Zap className="w-4 h-4 mr-2" />
                    Save Job
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl border-2 border-green-200 p-4 transform rotate-6"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-xs">
                  <div className="font-semibold text-gray-900">Saved!</div>
                  <div className="text-gray-600">Synced to dashboard</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
