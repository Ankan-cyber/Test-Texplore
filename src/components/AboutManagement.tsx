'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Eye, EyeOff, GripVertical, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AboutMemberForm from './AboutMemberForm';

interface AboutMember {
  id: string;
  displayName: string;
  role: string;
  category: string;
  isPublished: boolean;
  sortOrder: number;
  galleryImageId?: string;
  imageCloudinaryUrl?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export default function AboutManagement() {
  const [members, setMembers] = useState<AboutMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<AboutMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Fetch members
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/about?admin=true');
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const response = await fetch(`/api/about/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete member');
      
      setMembers(members.filter(m => m.id !== id));
      toast.success('Member deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleTogglePublished = async (id: string, currentPublished: boolean) => {
    try {
      const response = await fetch(`/api/about/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentPublished }),
      });

      if (!response.ok) throw new Error('Failed to update member');

      setMembers(members.map(m =>
        m.id === id ? { ...m, isPublished: !currentPublished } : m
      ));
      toast.success(`Member ${!currentPublished ? 'published' : 'unpublished'}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    }
  };

  const handleSaveForm = async (formData: any) => {
    try {
      const url = editingMember ? `/api/about/${editingMember.id}` : '/api/about';
      const method = editingMember ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save member');

      const savedMember = await response.json();
      
      if (editingMember) {
        setMembers(members.map(m => m.id === savedMember.id ? savedMember : m));
        toast.success('Member updated');
      } else {
        setMembers([...members, savedMember]);
        toast.success('Member added');
      }

      setShowForm(false);
      setEditingMember(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    }
  };

  const filteredMembers = members.filter(m =>
    m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const persistCategoryOrder = async (
    category: string,
    orderedCategoryMembers: AboutMember[],
  ) => {
    const reorderPayload = orderedCategoryMembers.map((member, index) => ({
      id: member.id,
      sortOrder: index,
    }));

    setSavingOrder(true);
    try {
      const response = await fetch('/api/about/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: reorderPayload }),
      });

      if (!response.ok) {
        throw new Error('Failed to save member order');
      }

      setMembers((prev) =>
        prev.map((member) => {
          if (member.category !== category) {
            return member;
          }

          const updated = reorderPayload.find((item) => item.id === member.id);
          return updated
            ? {
                ...member,
                sortOrder: updated.sortOrder,
              }
            : member;
        }),
      );
      toast.success('Order updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
      await fetchMembers();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDrop = async (targetMemberId: string, category: string) => {
    if (!draggingId || draggingId === targetMemberId) {
      setDraggingId(null);
      return;
    }

    const categoryMembers = members
      .filter((member) => member.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const fromIndex = categoryMembers.findIndex((m) => m.id === draggingId);
    const toIndex = categoryMembers.findIndex((m) => m.id === targetMemberId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggingId(null);
      return;
    }

    const reordered = [...categoryMembers];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setDraggingId(null);
    await persistCategoryOrder(category, reordered);
  };

  const categories = ['LEADERSHIP', 'DEPARTMENT'];

  return (
    <div className="space-y-6 p-0">
      {/* Search + Add */}
      <div className="border-b p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-md"
          />

          <Button
            type="button"
            onClick={() => {
              setEditingMember(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Member
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="space-y-6 p-4 sm:p-6">
        {categories.map((category) => {
          const categoryMembers = filteredMembers
            .filter((m) => m.category === category)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          
          return (
            <div key={category}>
              <h3 className="mb-4 font-semibold text-lg">{category}</h3>
              
              {categoryMembers.length === 0 ? (
                <p className="text-gray-500 text-sm">No members in this category</p>
              ) : (
                <div className="space-y-2">
                  {categoryMembers.map((member) => (
                    <Card
                      key={member.id}
                      draggable={!savingOrder}
                      onDragStart={() => setDraggingId(member.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(member.id, category)}
                      className={`flex flex-col gap-3 p-3 transition sm:flex-row sm:items-center sm:justify-between ${
                        draggingId === member.id
                          ? 'opacity-60'
                          : 'opacity-100'
                      } ${savingOrder ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                    >
                      <div className="flex flex-1 items-start gap-3 sm:items-center">
                        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1 sm:mt-0" />
                        
                        {member.imageCloudinaryUrl && (
                          <img
                            src={member.imageCloudinaryUrl}
                            alt={member.displayName}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.displayName}</p>
                          <p className="text-sm text-gray-600 truncate">{member.role}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublished(member.id, member.isPublished)}
                        >
                          {member.isPublished ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMember(member);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Edit Member' : 'Add Member'}
            </DialogTitle>
          </DialogHeader>
          <AboutMemberForm
            member={editingMember ? {
              id: editingMember.id,
              displayName: editingMember.displayName,
              role: editingMember.role,
              bio: editingMember.bio || '',
              linkedinUrl: editingMember.linkedinUrl || '',
              githubUrl: editingMember.githubUrl || '',
              portfolioUrl: editingMember.portfolioUrl || '',
              galleryImageId: editingMember.galleryImageId || '',
              category: editingMember.category,
              isPublished: editingMember.isPublished,
            } : undefined}
            onSave={handleSaveForm}
            onCancel={() => {
              setShowForm(false);
              setEditingMember(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
