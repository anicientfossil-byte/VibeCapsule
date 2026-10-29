import React, { useState } from 'react';
import { ANDROID_FILES } from '../data/androidProjectFiles';
import { AndroidSourceFile } from '../types';
import JSZip from 'jszip';
import { FolderCode, Download, Copy, Check, Search, FileCode, Layers, ShieldCheck } from 'lucide-react';

export const CodebaseViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidSourceFile>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: 'ALL FILES' },
    { id: 'ui', label: 'COMPOSE UI' },
    { id: 'components', label: 'COMPONENTS' },
    { id: 'data', label: 'ROOM DB' },
    { id: 'network', label: 'SPOTIFY PKCE' },
    { id: 'server', label: 'KTOR LAN' },
    { id: 'bridge', label: 'YOUTUBE BRIDGE' },
    { id: 'services', label: 'SERVICES & WORKER' },
    { id: 'gradle', label: 'GRADLE & TOML' },
    { id: 'manifest', label: 'MANIFEST' },
  ];

  const filteredFiles = ANDROID_FILES.filter((file) => {
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    const matchesSearch =
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add all project files
      ANDROID_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Add project-level root gradle files and README
      zip.file(
        'settings.gradle.kts',
        `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "VibeCapsule"
include(":app")
`
      );

      zip.file(
        'build.gradle.kts',
        `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.kapt) apply false
}
`
      );

      zip.file(
        'README.md',
        `# VIBECAPSULE: SWISS BRUTALIST SPOTIFY LEDGER
Target: Android 14 / Android 15 (API Level 34 - 37)

## Architecture Overview
- **UI System**: Jetpack Compose with custom Swiss Brutalist design system, spinning Vinyl physics visualizer, and mechanical camera detent toggles.
- **Data Layer**: Local-first SQLite database via AndroidX Room with immutable track snapshots and session skip audit logging.
- **Auth Engine**: Zero-cloud Crypto PKCE (SHA-256 + URL-safe Base64) for Spotify Web API.
- **LAN Jukebox Engine**: Embedded Ktor Netty HTTP server running on port 8080.
- **Background Daemon**: SnapshotSyncService foreground service & DailySnapshotWorker periodic sync via WorkManager.

## How to Run in Android Studio
1. Open Android Studio (Ladybug / Koala / Hedgehog).
2. Choose "Open Existing Project" and select this unzipped folder.
3. Sync Gradle and build the project on Android 14/15 emulator or physical device.
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VibeCapsule-Android-API37.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate project zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-[#FBF9F4] border-[3px] border-[#0F1A34] swiss-shadow p-5 mb-8">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b-2 border-[#0F1A34] gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-[#0F1A34] bg-[#0F1A34] text-[#FBF9F4]">
            <FolderCode className="w-5 h-5 text-[#E0533C]" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-[#2C221E] uppercase tracking-tight">
              PRODUCTION ANDROID ARCHITECTURE REPOSITORY
            </h3>
            <p className="text-xs font-mono text-[#0F1A34]/80">
              API Level 37 (Android 15) // Kotlin 1.9.22 // Compose 1.5.8 // Ktor 2.3.8 // Room 2.6.1
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="px-4 py-2 bg-[#E0533C] hover:bg-[#c4432d] text-[#FBF9F4] font-mono text-xs font-bold border-2 border-[#0F1A34] uppercase flex items-center justify-center gap-2 swiss-shadow-sm transition-transform active:translate-x-0.5 active:translate-y-0.5"
        >
          <Download className="w-4 h-4" />
          {isZipping ? 'PACKAGING REPO...' : 'DOWNLOAD ANDROID PROJECT (.ZIP)'}
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="mt-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold border border-[#0F1A34] uppercase transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#2C221E] text-[#FBF9F4]'
                  : 'bg-[#E5E2DA] text-[#2C221E] hover:bg-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#0F1A34]/50" />
          <input
            type="text"
            placeholder="FILTER FILES / SYMBOLS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border-2 border-[#0F1A34] text-xs font-mono text-[#2C221E] placeholder:text-[#2C221E]/40 focus:outline-none focus:ring-1 focus:ring-[#E0533C]"
          />
        </div>
      </div>

      {/* IDE Layout: File tree on left, Source view on right */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 border-2 border-[#0F1A34]">
        {/* File List Column */}
        <div className="md:col-span-4 bg-[#E5E2DA]/50 border-b md:border-b-0 md:border-r-2 border-[#0F1A34] max-h-[500px] overflow-y-auto">
          <div className="p-2 bg-[#0F1A34] text-[#FBF9F4] font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>PROJECT EXPLORER ({filteredFiles.length})</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#E0533C]" />
          </div>
          <div className="divide-y divide-[#0F1A34]/20">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              const fileName = file.path.split('/').pop();
              const dirPath = file.path.substring(0, file.path.lastIndexOf('/'));

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 transition-colors font-mono flex items-start gap-2 ${
                    isSelected
                      ? 'bg-[#2C221E] text-[#FBF9F4]'
                      : 'hover:bg-white text-[#2C221E]'
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-[#E0533C]' : 'text-[#0F1A34]'}`} />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate leading-tight">{fileName}</div>
                    <div className={`text-[9px] truncate ${isSelected ? 'text-[#FBF9F4]/70' : 'text-[#2C221E]/60'}`}>
                      {dirPath}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Source Code Viewer Column */}
        <div className="md:col-span-8 bg-[#2C221E] text-[#FBF9F4] flex flex-col max-h-[500px]">
          {/* File Header Bar */}
          <div className="p-2.5 bg-[#0F1A34] border-b border-[#FBF9F4]/20 flex items-center justify-between">
            <div className="font-mono text-xs font-bold text-[#FBF9F4] truncate flex items-center gap-2">
              <span className="text-[#E0533C]">●</span>
              <span>{selectedFile.path}</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-[#2C221E] hover:bg-[#E0533C] text-[#FBF9F4] font-mono text-[10px] font-bold border border-[#FBF9F4]/40 uppercase flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'COPIED!' : 'COPY CODE'}
            </button>
          </div>

          {/* Code block with line numbers */}
          <div className="flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed">
            <pre className="text-[#FBF9F4]">
              <code>
                {selectedFile.content.split('\n').map((line, idx) => (
                  <div key={idx} className="table-row">
                    <span className="table-cell select-none text-[#FBF9F4]/30 pr-4 text-right text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="table-cell whitespace-pre">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
