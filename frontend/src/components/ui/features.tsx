export default function Features() {
    return (
        <section className="py-16 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-4">
                    Everything you need to land your dream job
                </h2>
                <p className="text-center text-gray-600 mb-12">
                    Powerful features designed specifically for experienced professionals and tech workers
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        title="Application Tracking"
                        description="Keep track of all your job applications in one place with intelligent status updates and reminders."
                        icon="🎯"
                    />
                    <FeatureCard
                        title="Interview Preparation"
                        description="AI-powered interview prep with company-specific questions and personalized coaching."
                        icon="🧑‍💼"
                    />
                    <FeatureCard
                        title="Analytics & Insights"
                        description="Get detailed analytics on your job search performance and personalized recommendations."
                        icon="📊"
                    />
                    <FeatureCard
                        title="Smart Job Matching"
                        description="AI algorithms match you with relevant opportunities based on your skills and preferences."
                        icon="🔍"
                    />
                    <FeatureCard
                        title="Schedule Management"
                        description="Organize interviews, follow-ups, and deadlines with integrated calendar management."
                        icon="📅"
                    />
                    <FeatureCard
                        title="Resume Optimization"
                        description="AI-powered resume analysis and optimization for better ATS compatibility and impact."
                        icon="📄"
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({
    title,
    description,
    icon,
}: {
    title: string;
    description: string;
    icon: string;
}) {
    return (
        <div className="bg-blue-50 rounded-xl p-6 flex flex-col items-start shadow-sm">
            <div className="text-3xl mb-4">{icon}</div>
            <div className="font-semibold text-lg mb-2">{title}</div>
            <div className="text-gray-600">{description}</div>
        </div>
    );
}