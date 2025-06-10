'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

type Step = {
  title: string;
  description: string;
  component: React.ReactNode;
};

export default function SignUp() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    householdName: '',
    adults: 1,
    kids: 0,
    dietTags: [] as string[],
    dislikes: [] as string[],
    potsPref: 1,
    prepTimePref: 20,
    storePrefs: [] as string[]
  });

  const steps: Step[] = [
    {
      title: 'Household Name',
      description: 'What should we call your household?',
      component: (
        <div className="space-y-4">
          <input
            type="text"
            value={formData.householdName}
            onChange={(e) => setFormData({ ...formData, householdName: e.target.value })}
            placeholder="Enter household name"
            className="w-full p-2 border rounded"
          />
        </div>
      )
    },
    {
      title: 'Household Members',
      description: 'How many adults and children are in your household?',
      component: (
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Adults</label>
            <input
              type="number"
              min="1"
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Children</label>
            <input
              type="number"
              min="0"
              value={formData.kids}
              onChange={(e) => setFormData({ ...formData, kids: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      )
    },
    {
      title: 'Dietary Preferences',
      description: 'Any dietary restrictions or disliked ingredients?',
      component: (
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Dietary Tags</label>
            <input
              type="text"
              placeholder="e.g., vegetarian, gluten-free"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  e.preventDefault();
                  setFormData({
                    ...formData,
                    dietTags: [...formData.dietTags, e.currentTarget.value]
                  });
                  e.currentTarget.value = '';
                }
              }}
              className="w-full p-2 border rounded"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.dietTags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => setFormData({
                      ...formData,
                      dietTags: formData.dietTags.filter((_, index) => index !== i)
                    })}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-2">Disliked Ingredients</label>
            <input
              type="text"
              placeholder="e.g., mushrooms, cilantro"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  e.preventDefault();
                  setFormData({
                    ...formData,
                    dislikes: [...formData.dislikes, e.currentTarget.value]
                  });
                  e.currentTarget.value = '';
                }
              }}
              className="w-full p-2 border rounded"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.dislikes.map((dislike, i) => (
                <span
                  key={i}
                  className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm"
                >
                  {dislike}
                  <button
                    onClick={() => setFormData({
                      ...formData,
                      dislikes: formData.dislikes.filter((_, index) => index !== i)
                    })}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Cooking Preferences',
      description: 'How many pots do you prefer to use? How much prep time?',
      component: (
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Maximum Pots (0-3)</label>
            <input
              type="range"
              min="0"
              max="3"
              value={formData.potsPref}
              onChange={(e) => setFormData({ ...formData, potsPref: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="text-center">{formData.potsPref}</div>
          </div>
          <div>
            <label className="block mb-2">Prep Time (5-30 minutes)</label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={formData.prepTimePref}
              onChange={(e) => setFormData({ ...formData, prepTimePref: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="text-center">{formData.prepTimePref} minutes</div>
          </div>
        </div>
      )
    },
    {
      title: 'Store Preferences',
      description: 'Which grocery stores do you prefer?',
      component: (
        <div className="space-y-4">
          {['Save-On-Foods', 'Independent', 'Nesters'].map((store) => (
            <label key={store} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.storePrefs.includes(store)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      storePrefs: [...formData.storePrefs, store]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      storePrefs: formData.storePrefs.filter(s => s !== store)
                    });
                  }
                }}
                className="form-checkbox"
              />
              <span>{store}</span>
            </label>
          ))}
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form
      toast({
        title: 'Success!',
        description: 'Your household has been created.',
      });
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {steps[currentStep].title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {steps[currentStep].description}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {steps[currentStep].component}
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className={`${
                currentStep === 0 ? 'invisible' : ''
              } bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded`}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 