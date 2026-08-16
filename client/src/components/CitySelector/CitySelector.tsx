/**
 * CitySelector - 服务城市选择器
 * 复刻天鹅到家原版「选择城市」UI（2026-08-10 用户提供截图）
 * 特性:
 *   - 顶部显示当前定位城市 + 重新定位按钮
 *   - 城市按首字母分组
 *   - 右侧字母索引（B C D F G H J K N Q S T W X Z）一键跳转
 *   - 移动端从底部弹出 (Sheet)
 *
 * 2026-08-10 用户反馈:去掉热门城市 + 红色"热"标记，按字母顺序展示所有 35 城
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MapPin, RefreshCw, Search } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@client/src/components/ui/sheet';
import { Input } from '@client/src/components/ui/input';
import { cn } from '@client/src/lib/utils';
import {
  CITY_GROUPS,
  CITY_INDEX_LETTERS,
  SERVICE_CITIES,
  type ServiceCity,
} from '@shared/cities';

interface CitySelectorProps {
  value: ServiceCity | '';
  onChange: (city: ServiceCity) => void;
  disabled?: boolean;
  /** 定位城市（IP/浏览器定位），未获取时为 null */
  detectedCity?: ServiceCity | null;
  /** 触发重新定位（父组件监听） */
  onRequestLocation?: () => void;
  /** 是否正在定位 */
  locating?: boolean;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  detectedCity = null,
  onRequestLocation,
  locating = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 搜索过滤后的城市
  const filteredCities = useMemo<ServiceCity[]>(() => {
    if (!searchKeyword.trim()) return [...SERVICE_CITIES];
    const kw = searchKeyword.trim();
    return SERVICE_CITIES.filter((c) => c.includes(kw));
  }, [searchKeyword]);

  // 搜索态下不分字母组
  const isSearching = searchKeyword.trim().length > 0;

  // 点击字母索引跳转
  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter);
    const target = sectionRefs.current[letter];
    if (target && listRef.current) {
      listRef.current.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' });
    }
  };

  // 选中后关闭
  const handleSelect = (city: ServiceCity) => {
    onChange(city);
    setOpen(false);
    setSearchKeyword('');
    setActiveLetter(null);
  };

  // 关闭时重置状态
  useEffect(() => {
    if (!open) {
      setSearchKeyword('');
      setActiveLetter(null);
    }
  }, [open]);

  return (
    <>
      {/* 触发按钮（表单中显示） */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          'mt-1.5 w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-left text-sm',
          'hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400',
          'flex items-center justify-between min-h-[40px]',
          !value && 'text-gray-400',
        )}
      >
        <span>{value || '请选择您所在城市'}</span>
        <span className="text-gray-300 text-xs">▾</span>
      </button>

      {/* 城市选择抽屉 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] p-0 flex flex-col bg-white [&>button]:hidden"
        >
          <SheetHeader className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                ‹ 取消
              </button>
              <SheetTitle className="text-base font-semibold">选择城市</SheetTitle>
              <span className="w-10" />
            </div>

            {/* 当前定位 */}
            <div className="mt-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 text-blue-600" />
                {locating ? (
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    定位中…
                  </span>
                ) : detectedCity ? (
                  <span className="text-gray-800">{detectedCity}</span>
                ) : (
                  <span className="text-gray-400">未定位</span>
                )}
              </div>
              {onRequestLocation && (
                <button
                  type="button"
                  onClick={onRequestLocation}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', locating && 'animate-spin')} />
                  重新定位
                </button>
              )}
            </div>

            {/* 搜索框 */}
            <div className="mt-3 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索城市名（如：北京）"
                className="pl-8 h-9 text-sm"
              />
            </div>
          </SheetHeader>

          {/* 主体：城市列表 + 字母索引 */}
          <div className="flex-1 flex overflow-hidden">
            {/* 左侧：城市列表 */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 pb-4"
              onScroll={(e) => {
                const scrollTop = e.currentTarget.scrollTop;
                let currentLetter: string | null = null;
                for (const g of CITY_GROUPS) {
                  const el = sectionRefs.current[g.letter];
                  if (el && el.offsetTop - 20 <= scrollTop) {
                    currentLetter = g.letter;
                  }
                }
                if (currentLetter && currentLetter !== activeLetter) {
                  setActiveLetter(currentLetter);
                }
              }}
            >
              {isSearching ? (
                <div className="pt-3">
                  {filteredCities.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">
                      没有找到「{searchKeyword}」相关的城市
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {filteredCities.map((city) => (
                        <CityRow
                          key={city}
                          city={city}
                          isSelected={value === city}
                          onClick={() => handleSelect(city)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <>
                  {CITY_GROUPS.map((group) => {
                    if (activeLetter && activeLetter !== group.letter) return null;
                    return (
                      <div
                        key={group.letter}
                        ref={(el) => {
                          sectionRefs.current[group.letter] = el;
                        }}
                        className="pt-3"
                      >
                        <h3 className="text-xs font-semibold text-gray-500 mb-2">
                          {group.letter}
                        </h3>
                        <ul className="space-y-1">
                          {group.cities.map((city) => (
                            <CityRow
                              key={city}
                              city={city}
                              isSelected={value === city}
                              onClick={() => handleSelect(city)}
                            />
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* 右侧：字母索引（仅非搜索态显示） */}
            {!isSearching && (
              <div className="w-7 flex-shrink-0 py-3 flex flex-col items-center justify-center gap-0.5 select-none border-l border-gray-50">
                {CITY_INDEX_LETTERS.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleLetterClick(letter)}
                    className={cn(
                      'w-5 h-5 text-[10px] flex items-center justify-center rounded',
                      activeLetter === letter
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-gray-500 hover:text-blue-600',
                    )}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

interface CityRowProps {
  city: ServiceCity;
  isSelected: boolean;
  onClick: () => void;
}

const CityRow: React.FC<CityRowProps> = ({ city, isSelected, onClick }) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-2 py-2 rounded text-sm flex items-center justify-between hover:bg-blue-50 transition-colors',
        isSelected && 'bg-blue-50 text-blue-700 font-medium',
      )}
    >
      <span>{city}</span>
      {isSelected && <span className="text-blue-600 text-xs">✓</span>}
    </button>
  </li>
);

export default CitySelector;
