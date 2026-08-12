import React from "react";

const HomePageValues = () => {
  const values = [
    {
      id: 1,
      icon: "🧵",
      title: "Handcrafted",
      description: "Handcrafted in small batches",
    },
    {
      id: 2,
      icon: "🌿",
      title: "Natural Ingredients",
      description: "Made using natural, sustainably-sourced ingredients",
    },
    {
      id: 3,
      icon: "☪️",
      title: "Halal & Alcohol-Free",
      description: "100% Halal; Non-alcoholic",
    },
    {
      id: 4,
      icon: "🐰",
      title: "Cruelty-Free",
      description: "Cruelty-free",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Heading with black/gray gradient */}
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
        <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
          Our Values
        </span>
      </h2>
      <div className="w-16 h-1 bg-gradient-to-r from-gray-400 to-gray-600 mx-auto mb-8 rounded-full" />

      {/* Grid of value cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {values.map((value) => (
          <div
            key={value.id}
            className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow duration-300 flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-4">
              {value.icon}
            </div>
            <h3 className="font-semibold text-gray-800 text-base mb-1">
              {value.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {value.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePageValues;