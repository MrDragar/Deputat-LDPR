import React from 'react';
import Tag from './Tag';

interface TagListProps {
    tags: string[] | undefined | null;
}

const TagList: React.FC<TagListProps> = ({ tags }) => {
    if (!tags || tags.length === 0) {
        return <p className="text-base text-gray-900">—</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
                <Tag key={index}>{tag}</Tag>
            ))}
        </div>
    );
};

export default TagList;
