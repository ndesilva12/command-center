import { useEffect, useState } from 'react';

export interface ToolCustomization {
  name: string;
  color: string;
  visible: boolean;
  mobileVisible: boolean;
  order: number;
}

export function useToolCustomizations() {
  const [customizations, setCustomizations] = useState<Record<string, ToolCustomization>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomizations = async () => {
      try {
        const res = await fetch('/api/settings/tools');
        if (res.ok) {
          const data = await res.json();
          setCustomizations(data.customizations || {});
        }
      } catch (error) {
        console.error('Failed to load tool customizations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomizations();
  }, []);

  const getCustomization = (toolId: string, defaultName: string, defaultColor: string): ToolCustomization => {
    return customizations[toolId] || {
      name: defaultName,
      color: defaultColor,
      visible: true,
      mobileVisible: true,
      order: 0,
    };
  };

  return { customizations, loading, getCustomization };
}
