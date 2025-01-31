import { useTaskContext, Task } from "../context/Context";
import { Button, Radio, Input, Select, DatePicker } from 'antd'
import { LogOut } from 'lucide-react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import React from "react";
import './Header.css';

dayjs.extend(isBetween);

interface HeaderProps {
    handleLogout: () => void;
    handleOpenModal: (task: Task | null) => void;
    searchQuery: string;
    handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setCategoryFilter: (category: 'Personal' | 'Work' | 'All') => void;
    setDateRange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
}

const Header: React.FC<HeaderProps> = ({

    handleLogout,
    handleOpenModal,
    searchQuery,
    handleSearchChange,
    setCategoryFilter,
    setDateRange,
}) => {

    const { userDetails, viewType, setViewType } = useTaskContext();
    const userName = userDetails ? userDetails.displayName : 'Guest';
    const profilePicture = userDetails ? userDetails.photoURL : '';
    return (
        <div className="header" >
            <div className="top-row" >
                <div className='title' >
                    <h3>
                        <span className="material-symbols-outlined text-2xl">assignment</span>
                        Task Buddy</h3>
                </div>

                <div className="profile">
                    {profilePicture ? (
                        <img
                            src={profilePicture}
                            alt="Profile"
                            className="profile-picture"
                        />
                    ) : (
                        <div
                            className="profile-placeholder"

                        >
                            {userName ? userName.charAt(0).toUpperCase() : 'G'}
                        </div>
                    )}
                    <span className="font-medium">{userName}</span>
                </div>
            </div>

            <div className="header-second-row" >
                <div className="radio-group">
                    <Radio.Group
                        value={viewType}
                        onChange={e => setViewType(e.target.value)}
                        className="radio">
                        <Radio.Button className="radio-button" value="board"><span className="material-symbols-outlined" >list</span>List</Radio.Button>
                        <Radio.Button className="radio-button" value="kanban"><span className='material-symbols-outlined'>developer_board</span>Board</Radio.Button>
                    </Radio.Group></div>
                <Button
                    className='logout-button'
                    type="text"
                    onClick={handleLogout}
                >
                    <LogOut size={16} />
                    Logout
                </Button>
            </div>
            <div className="header-third-row" >
                <div className="filters" >
                    <Select
                        className="category-select"
                        placeholder="Category"
                        defaultValue="All"
                        onChange={(value: ('All' | 'Work' | 'Personal')) => setCategoryFilter(value)}
                    >
                        <Select.Option value="All">All</Select.Option>
                        <Select.Option value="Work">Work</Select.Option>
                        <Select.Option value="Personal">Personal</Select.Option>
                    </Select>
                    <DatePicker.RangePicker
                        className="date-picker"
                        onChange={(dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => setDateRange(dates || [null, null])}
                        placeholder={['Due', 'Date']}
                    />
                </div>
                <div className="flex gap-4">
                    <Input.Search
                        className="search-input"
                        placeholder="Search tasks by title"
                        allowClear
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <Button className='create-button' type="primary" onClick={() => handleOpenModal(null)}>
                        Add Task
                    </Button>
                </div>
            </div>
        </div>
    );
};


export default Header;