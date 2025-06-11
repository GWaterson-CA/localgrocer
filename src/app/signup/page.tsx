'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

// New Select component
const Select = ({ value, onChange, options, placeholder, className }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder?: string; className?: string }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`p-2 border rounded ${className || ''}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer Not to Say' },
];
const POPULAR_DIET_TAGS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Paleo', 'Keto', 'Halal', 'Kosher'
];
const POPULAR_INGREDIENTS = [
  'Mushrooms', 'Cilantro', 'Onions', 'Peanuts', 'Shellfish', 'Bell Peppers', 'Tomatoes', 'Garlic'
];
const POPULAR_MEALS = [
  'Pizza', 'Steak', 'Mac & Cheese', 'Tacos', 'BBQ', 'Sushi', 'Salad', 'Pasta', 'Burgers', 'Stir Fry'
];
const FREQUENCY_OPTIONS = [
  'Every week', 'Every 2 weeks', 'Every month', 'Every Tuesday', 'Custom...'
];

export default function SignUp() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    householdName: '',
    adults: 1,
    kids: 0,
    members: [
      { name: '', age: '', gender: '', dietTags: [] as string[], likedIngredients: [] as string[], dislikedIngredients: [] as string[], favoriteMeals: [] as string[] }
    ],
    potsPref: 1,
    prepTimePref: 20,
    storePrefs: [] as string[],
    familyFavoriteMeals: [] as { name: string; frequency: string }[]
  });
  const [familyMealName, setFamilyMealName] = useState('');
  const [familyMealFrequency, setFamilyMealFrequency] = useState('');

  // Helper to update a member
  const updateMember = (idx: number, changes: any) => {
    setFormData((prev) => {
      const members = [...prev.members];
      members[idx] = { ...members[idx], ...changes };
      return { ...prev, members };
    });
  };

  // Add/Remove member
  const addMember = () => setFormData((prev) => ({ ...prev, members: [...prev.members, { name: '', age: '', gender: '', dietTags: [] as string[], likedIngredients: [] as string[], dislikedIngredients: [] as string[], favoriteMeals: [] as string[] }] }));
  const removeMember = (idx: number) => setFormData((prev) => ({ ...prev, members: prev.members.filter((_, i) => i !== idx) }));

  const steps = [
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
      description: 'How many adults and children are in your household? (Add a profile for each member for best results)',
      component: (
        <div className="space-y-6">
          <div className="flex gap-4">
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
          <div className="mt-6">
            <label className="block font-semibold mb-2">Member Profiles</label>
            {formData.members.map((member, idx) => (
              <div key={idx} className="border rounded p-4 mb-4 bg-gray-50">
                <div className="flex gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={member.name}
                    onChange={e => updateMember(idx, { name: e.target.value })}
                    className="p-2 border rounded w-1/3"
                  />
                  <input
                    type="number"
                    placeholder="Age (optional)"
                    value={member.age}
                    onChange={e => updateMember(idx, { age: e.target.value })}
                    className="p-2 border rounded w-1/4"
                  />
                  <select
                    value={member.gender}
                    onChange={e => updateMember(idx, { gender: e.target.value })}
                    className="p-2 border rounded w-1/3"
                  >
                    <option value="">Gender (optional)</option>
                    {GENDER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {formData.members.length > 1 && (
                    <button type="button" className="ml-2 text-red-600" onClick={() => removeMember(idx)}>
                      Remove
                    </button>
                  )}
                </div>
                {/* Dietary Tags */}
                <div className="mb-2">
                  <label className="block mb-1">Dietary Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {POPULAR_DIET_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`px-3 py-1 rounded-full border ${member.dietTags.includes(tag) ? 'bg-green-200 border-green-400 text-green-900' : 'bg-gray-100 border-gray-300 text-gray-700'} transition`}
                        onClick={() => updateMember(idx, {
                          dietTags: member.dietTags.includes(tag)
                            ? member.dietTags.filter((t: string) => t !== tag)
                            : [...member.dietTags, tag]
                        })}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add or search dietary tag..."
                    className="w-full p-2 border rounded"
                    list={`diet-tag-suggestions-${idx}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !member.dietTags.includes(val)) {
                          updateMember(idx, { dietTags: [...member.dietTags, val] });
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <datalist id={`diet-tag-suggestions-${idx}`}>
                    {POPULAR_DIET_TAGS.filter(tag => !member.dietTags.includes(tag)).map(tag => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {member.dietTags.map((tag: string, i: number) => (
                      <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center">
                        {tag}
                        <button
                          onClick={() => updateMember(idx, { dietTags: member.dietTags.filter((_: string, index: number) => index !== i) })}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Liked Ingredients */}
                <div className="mb-2">
                  <label className="block mb-1">Liked Ingredients</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {POPULAR_INGREDIENTS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`px-3 py-1 rounded-full border ${member.likedIngredients.includes(item) ? 'bg-blue-200 border-blue-400 text-blue-900' : 'bg-gray-100 border-gray-300 text-gray-700'} transition`}
                        onClick={() => updateMember(idx, {
                          likedIngredients: member.likedIngredients.includes(item)
                            ? member.likedIngredients.filter((t: string) => t !== item)
                            : [...member.likedIngredients, item]
                        })}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add or search liked ingredient..."
                    className="w-full p-2 border rounded"
                    list={`liked-suggestions-${idx}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !member.likedIngredients.includes(val)) {
                          updateMember(idx, { likedIngredients: [...member.likedIngredients, val] });
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <datalist id={`liked-suggestions-${idx}`}>
                    {POPULAR_INGREDIENTS.filter(item => !member.likedIngredients.includes(item)).map(item => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {member.likedIngredients.map((item: string, i: number) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                        {item}
                        <button
                          onClick={() => updateMember(idx, { likedIngredients: member.likedIngredients.filter((_: string, index: number) => index !== i) })}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Disliked Ingredients */}
                <div className="mb-2">
                  <label className="block mb-1">Disliked Ingredients</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {POPULAR_INGREDIENTS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`px-3 py-1 rounded-full border ${member.dislikedIngredients.includes(item) ? 'bg-red-200 border-red-400 text-red-900' : 'bg-gray-100 border-gray-300 text-gray-700'} transition`}
                        onClick={() => updateMember(idx, {
                          dislikedIngredients: member.dislikedIngredients.includes(item)
                            ? member.dislikedIngredients.filter((t: string) => t !== item)
                            : [...member.dislikedIngredients, item]
                        })}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add or search disliked ingredient..."
                    className="w-full p-2 border rounded"
                    list={`dislike-suggestions-${idx}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !member.dislikedIngredients.includes(val)) {
                          updateMember(idx, { dislikedIngredients: [...member.dislikedIngredients, val] });
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <datalist id={`dislike-suggestions-${idx}`}>
                    {POPULAR_INGREDIENTS.filter(item => !member.dislikedIngredients.includes(item)).map(item => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {member.dislikedIngredients.map((item: string, i: number) => (
                      <span key={i} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm flex items-center">
                        {item}
                        <button
                          onClick={() => updateMember(idx, { dislikedIngredients: member.dislikedIngredients.filter((_: string, index: number) => index !== i) })}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Favorite Meals */}
                <div className="mb-2">
                  <label className="block mb-1">Favorite Meals</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {POPULAR_MEALS.map((meal) => (
                      <button
                        key={meal}
                        type="button"
                        className={`px-3 py-1 rounded-full border ${member.favoriteMeals?.includes(meal) ? 'bg-yellow-200 border-yellow-400 text-yellow-900' : 'bg-gray-100 border-gray-300 text-gray-700'} transition`}
                        onClick={() => updateMember(idx, {
                          favoriteMeals: member.favoriteMeals?.includes(meal)
                            ? member.favoriteMeals.filter((t: string) => t !== meal)
                            : [...(member.favoriteMeals || []), meal]
                        })}
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add or search favorite meal..."
                    className="w-full p-2 border rounded"
                    list={`favorite-meal-suggestions-${idx}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !(member.favoriteMeals || []).includes(val)) {
                          updateMember(idx, { favoriteMeals: [...(member.favoriteMeals || []), val] });
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <datalist id={`favorite-meal-suggestions-${idx}`}>
                    {POPULAR_MEALS.filter(meal => !(member.favoriteMeals || []).includes(meal)).map(meal => (
                      <option key={meal} value={meal} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(member.favoriteMeals || []).map((meal: string, i: number) => (
                      <span key={i} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm flex items-center">
                        {meal}
                        <button
                          onClick={() => updateMember(idx, { favoriteMeals: member.favoriteMeals.filter((_: string, index: number) => index !== i) })}
                          className="ml-2 text-yellow-600 hover:text-yellow-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="bg-green-600 text-white px-4 py-2 rounded" onClick={addMember}>
              + Add Member
            </button>
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
    },
    {
      title: 'Family Favorite Meals',
      description: 'Are there any meals your family likes to have regularly? (e.g., Tacos every Tuesday, BBQ once a week, Mac & Cheese every 2 weeks)',
      component: (
        <div className="space-y-4">
          {formData.familyFavoriteMeals?.map((meal, idx) => (
            <div key={idx} className="flex gap-2 items-center mb-2">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">{meal.name}</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">{meal.frequency}</span>
              <button type="button" className="ml-2 text-red-600" onClick={() => setFormData(prev => ({ ...prev, familyFavoriteMeals: prev.familyFavoriteMeals.filter((_, i) => i !== idx) }))}>
                Remove
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Meal name..."
              className="p-2 border rounded flex-1"
              list="family-meal-suggestions"
              value={familyMealName}
              onChange={e => setFamilyMealName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Frequency (e.g., Every week, Custom...)"
              className="p-2 border rounded flex-1"
              list="family-meal-frequency-suggestions"
              value={familyMealFrequency}
              onChange={e => setFamilyMealFrequency(e.target.value)}
            />
            <datalist id="family-meal-suggestions">
              {POPULAR_MEALS.map(meal => (
                <option key={meal} value={meal} />
              ))}
            </datalist>
            <datalist id="family-meal-frequency-suggestions">
              {FREQUENCY_OPTIONS.map(opt => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
            <button
              type="button"
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => {
                const name = familyMealName.trim();
                const frequency = familyMealFrequency.trim();
                if (name && frequency) {
                  setFormData(prev => ({
                    ...prev,
                    familyFavoriteMeals: [...(prev.familyFavoriteMeals || []), { name, frequency }]
                  }));
                  setFamilyMealName('');
                  setFamilyMealFrequency('');
                }
              }}
            >
              + Add
            </button>
          </div>
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