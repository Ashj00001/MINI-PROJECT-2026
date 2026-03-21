with open('src/app/pages/CreateTraining.tsx', 'r') as f:
    lines = f.read().splitlines()

# find index of the line
idx = -1
for i, line in enumerate(lines):
    if "if (formData.requiredInstitutions.length === 0) newErrors.requiredInstitutions = 'Select at least one institution';" in line:
        idx = i
        break

if idx != -1:
    missing_part = """
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        program: formData.program === 'Other' ? formData.customProgram : formData.program,
        targetAudience: formData.targetAudience.map(a => a === 'Other' ? formData.customTargetAudience : a),
        date: new Date(formData.date),
        startTime: formData.startTime,
        endTime: formData.endTime,
        hallId: formData.hallId,
        capacity: parseInt(formData.capacity),
        requiredInstitutions: formData.requiredInstitutions,
        status: 'scheduled' as TrainingStatus,
      };

      if (isEditMode && id) {
        await api.put(`/trainings/${id}`, payload);
        toast.success('Training updated successfully!');
      } else {
        await trainingsApi.create({
          ...payload,
          trainerId: user.id,
          createdById: user.id,
        });
        toast.success('Training created successfully!');
      }
      navigate('/trainings');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Error saving training');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHall = async () => {
    if (!user) return;

    if (!formData.hallId) {
      toast.error("Please select a hall first");
      return;
    }

    setRequestLoading(true);
    try {
      let trainingId = id;

      if (!trainingId) {
        const payload = {
          title: formData.title,
          description: formData.description,
          program: formData.program === 'Other' ? formData.customProgram : formData.program,
          targetAudience: formData.targetAudience.map(a => a === 'Other' ? formData.customTargetAudience : a),
          date: new Date(formData.date),
          startTime: formData.startTime,
          endTime: formData.endTime,
          hallId: formData.hallId,
          capacity: parseInt(formData.capacity),
          requiredInstitutions: formData.requiredInstitutions,
          status: 'draft' as TrainingStatus
        };

        if (!formData.title) {
          toast.error("Please enter a title");
          setRequestLoading(false);
          return;
        }

        const newTraining = await trainingsApi.create({
          ...payload,
          trainerId: user.id,
          createdById: user.id
        });
        trainingId = newTraining.id;
      }

      await hallRequestsApi.create({
        trainingId: trainingId,
        hallId: formData.hallId,
        priority: requestPriority,
        remarks: requestRemarks
      });

      toast.success('Hall request submitted successfully!');
      setShowRequestDialog(false);
      navigate('/trainings');

    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error(error.message || 'Failed to submit hall request');
    } finally {
      setRequestLoading(false);
    }
  };



  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingAnimation text={t('createTraining.saving', 'Loading...')} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/trainings')}>
          <ArrowLeft className="size-4 mr-2" />
          {t('createTraining.back', 'Back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEditMode ? t('createTraining.titleEdit', 'Edit Training') : t('createTraining.titleCreate', 'Create Training')}</h1>
          <p className="text-gray-500 mt-1">{isEditMode ? t('createTraining.descEdit', 'Update training details') : t('createTraining.descCreate', 'Schedule a new training session')}</p>
        </div>
      </div>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createTraining.dialog.title', 'Request Hall Approval')}</DialogTitle>
            <DialogDescription>
              {t('createTraining.dialog.desc', 'Submit a request to the Admin for this hall booking.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t('createTraining.fields.title', 'Training Title *')}</Label>
              <Input value={formData.title} disabled className="bg-gray-100" />
            </div>
            <div>
              <Label>{t('createTraining.dialog.requestedHall', 'Requested Hall')}</Label>
              <Input value={halls.find(h => h.id === formData.hallId)?.name || ''} disabled className="bg-gray-100" />
            </div>
            <div>
              <Label>{t('createTraining.dialog.timeSlot', 'Time Slot')}</Label>
              <Input value={`${new Date(formData.date).toLocaleDateString()} | ${formData.startTime} - ${formData.endTime}`} disabled className="bg-gray-100" />
            </div>
            <div>
              <Label>{t('createTraining.dialog.priority', 'Priority')}</Label>
              <Select value={requestPriority} onValueChange={(val: any) => setRequestPriority(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{t('createTraining.dialog.normal', 'Normal')}</SelectItem>
                  <SelectItem value="urgent">{t('createTraining.dialog.urgent', 'Urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('createTraining.dialog.remarks', 'Remarks (Optional)')}</Label>
              <Textarea
                value={requestRemarks}
                onChange={(e) => setRequestRemarks(e.target.value)}
                placeholder={t('createTraining.dialog.remarksPlaceholder', 'Reason for urgency or special requirements...')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>{t('createTraining.buttons.cancel', 'Cancel')}</Button>
            <Button onClick={handleRequestHall} disabled={requestLoading}>
              {requestLoading ? t('createTraining.buttons.sending', 'Sending...') : t('createTraining.buttons.sendRequest', 'Send Request')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('createTraining.sections.basic.title', 'Basic Information')}</CardTitle>
            <CardDescription>{t('createTraining.sections.basic.desc', 'Enter the training details')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">{t('createTraining.fields.title', 'Training Title *')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={t('createTraining.fields.titlePlaceholder', 'e.g., Emergency Response & First Aid')}
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="description">{t('createTraining.fields.desc', 'Description *')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('createTraining.fields.descPlaceholder', 'Detailed description of the training program')}
                rows={4}
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="program">{t('createTraining.fields.program', 'Program *')}</Label>
                <Select value={formData.program} onValueChange={(value) => handleChange('program', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('createTraining.fields.programPlaceholder', 'Select program')} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program} value={program}>
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.program === 'Other' && (
                  <div className="mt-3">
                    <Input
                      value={formData.customProgram}
                      onChange={(e) => handleChange('customProgram', e.target.value)}
                      placeholder={t('createTraining.fields.customProgramPlaceholder', 'Enter custom program name')}
                    />
                    {errors.customProgram && <p className="text-sm text-red-600 mt-1">{errors.customProgram}</p>}
                  </div>
                )}
                {errors.program && <p className="text-sm text-red-600 mt-1">{errors.program}</p>}
              </div>

              <div>
                <Label htmlFor="targetAudience">{t('createTraining.fields.targetAudience', 'Target Audience *')}</Label>
                <MultiSelect
                  options={TARGET_AUDIENCES.map((opt) => ({ label: opt, value: opt }))}
                  selected={formData.targetAudience}
                  onChange={(value) => handleChange('targetAudience', value)}
                  placeholder={t('createTraining.fields.targetAudiencePlaceholder', 'Select target audience')}
                />
                {formData.targetAudience.includes('Other') && ("""
    
    new_lines = lines[:idx+1] + missing_part.splitlines() + lines[idx+1:]
    with open('src/app/pages/CreateTraining.tsx', 'w') as f:
        f.write('\\n'.join(new_lines))
    print("Fixed!")
