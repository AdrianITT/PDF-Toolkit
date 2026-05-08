import { useState } from 'react';
import { Input, Button, Space, Tag } from 'antd';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  onClear: () => void;
  matchCount: number;
  currentMatchIndex: number;
  isSearching: boolean;
}

export function SearchBar({
  onSearch,
  onPrevMatch,
  onNextMatch,
  onClear,
  matchCount,
  currentMatchIndex,
  isSearching,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (!value) {
      onClear();
    } else {
      onSearch(value);
    }
  };

  return (
    <Space>
      <Input.Search
        placeholder="Buscar en PDF..."
        allowClear
        size="small"
        style={{ width: 220 }}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onSearch={(value) => handleSearch(value)}
        loading={isSearching}
      />
      {matchCount > 0 && (
        <Tag color="blue">
          {currentMatchIndex + 1} / {matchCount}
        </Tag>
      )}
      {matchCount > 0 && (
        <>
          <Button
            size="small"
            onClick={onPrevMatch}
            disabled={matchCount === 0}
          >
            ↑
          </Button>
          <Button
            size="small"
            onClick={onNextMatch}
            disabled={matchCount === 0}
          >
            ↓
          </Button>
        </>
      )}
    </Space>
  );
}
