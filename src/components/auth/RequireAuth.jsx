import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from './AuthProvider';
import { createPageUrl } from '@/utils';
import LoadingShell from '@/components/ui/LoadingShell';

export default function RequireAuth({ children }) {
  // Public access mode: render children without auth checks
  return children;
}