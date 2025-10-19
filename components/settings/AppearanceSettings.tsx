import React from "react";
import { Sun, Moon, Upload, Globe, Type, Monitor } from "lucide-react";
import { UserSettings } from "@/types";
import { ColorPicker } from "./ColorPicker";
import { useTheme } from "@/context/ThemeContext";

interface AppearanceSettingsProps {
  settings: UserSettings;
  updateSettings: (section: string, data: any) => void;
  uploadBackground: (file: File) => void;
}

export default function AppearanceSettings({
  settings,
  updateSettings,
  uploadBackground,
}: AppearanceSettingsProps) {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);

    updateSettings("appearance", {
      ...settings.appearance,
      theme: newTheme,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl border border-yellow-100 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
            <Sun className="h-4 w-4 text-white" />
          </div>
          Theme Selection
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              value: "light",
              label: "Light",
              icon: Sun,
              gradient: "from-yellow-400 to-orange-400",
              description: "Classic bright interface",
            },
            {
              value: "dark",
              label: "Dark",
              icon: Moon,
              gradient: "from-gray-700 to-gray-900",
              description: "Easy on the eyes",
            },
            {
              value: "light",
              label: "Auto",
              icon: Monitor,
              gradient: "from-blue-500 to-purple-600",
            },
          ].map(({ value, label, icon: Icon, gradient, description }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value as "light" | "dark")}
              className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                theme === value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg ring-2 ring-blue-200 dark:ring-blue-700"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md bg-white dark:bg-gray-800"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-r ${gradient} mx-auto mb-3 flex items-center justify-center shadow-lg`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900 dark:text-white block mb-1">
                  {label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl border border-purple-100 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
            <Type className="h-4 w-4 text-white" />
          </div>
          Font Size
        </h3>
        <div className="space-y-3">
          {[
            { value: "small", label: "Small", preview: "text-sm" },
            { value: "medium", label: "Medium", preview: "text-base" },
            { value: "large", label: "Large", preview: "text-lg" },
          ].map(({ value, label, preview }) => (
            <label
              key={value}
              className="flex items-center p-4 rounded-xl hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-gray-600"
            >
              <input
                type="radio"
                name="fontSize"
                value={value}
                checked={settings.appearance.fontSize === value}
                onChange={(e) =>
                  updateSettings("appearance", {
                    ...settings.appearance,
                    fontSize: e.target.value,
                  })
                }
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600"
              />
              <span
                className={`ml-4 font-medium text-gray-900 dark:text-white ${preview}`}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl border border-green-100 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
            <Upload className="h-4 w-4 text-white" />
          </div>
          Background Image
        </h3>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {settings.appearance.backgroundImage && (
            <div className="relative group">
              <img
                src={settings.appearance.backgroundImage}
                alt="Background"
                className="h-24 w-24 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-200"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>
          )}
          <label className="cursor-pointer bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-medium">
            <Upload className="h-4 w-4 mr-2" />
            Upload Background
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadBackground(file);
              }}
            />
          </label>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl border border-indigo-100 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
        <ColorPicker
          value={settings.appearance.accentColor}
          onChange={(color: any) =>
            updateSettings("appearance", {
              ...settings.appearance,
              accentColor: color,
            })
          }
          label="Accent Color"
        />
      </div>

      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl border border-blue-100 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Globe className="h-4 w-4 text-white" />
          </div>
          Language
        </h3>
        <select
          value={settings.appearance.language}
          onChange={(e) =>
            updateSettings("appearance", {
              ...settings.appearance,
              language: e.target.value,
            })
          }
          className="block w-full sm:w-1/2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors font-medium"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
        </select>
      </div>
    </div>
  );
}
