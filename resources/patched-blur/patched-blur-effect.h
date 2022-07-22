/* shell-blur-effect.h
 *
 * Copyright 2019 Georges Basile Stavracas Neto <georges.stavracas@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

#pragma once

#include <clutter/clutter.h>

G_BEGIN_DECLS

/**
 * PatchedBlurMode:
 * @SHELL_BLUR_MODE_ACTOR: blur the actor contents, and its children
 * @SHELL_BLUR_MODE_BACKGROUND: blur what's beneath the actor
 *
 * The mode of blurring of the effect.
 */
typedef enum
{
  PATCHED_BLUR_MODE_ACTOR,
  PATCHED_BLUR_MODE_BACKGROUND,
} PatchedBlurMode;

#define PATCHED_TYPE_BLUR_EFFECT (patched_blur_effect_get_type())
G_DECLARE_FINAL_TYPE (PatchedBlurEffect, patched_blur_effect, PATCHED, BLUR_EFFECT, ClutterEffect)

PatchedBlurEffect *patched_blur_effect_new (void);

int patched_blur_effect_get_sigma (PatchedBlurEffect *self);
void patched_blur_effect_set_sigma (PatchedBlurEffect *self,
                                    int              sigma);

float patched_blur_effect_get_brightness (PatchedBlurEffect *self);
void patched_blur_effect_set_brightness (PatchedBlurEffect *self,
                                        float            brightness);

PatchedBlurMode patched_shell_blur_effect_get_mode (PatchedBlurEffect *self);
void patched_blur_effect_set_mode (PatchedBlurEffect *self,
                                   PatchedBlurMode    mode);

void patched_blur_effect_set_skip (PatchedBlurEffect *self,
                                   gboolean skip);

float patched_blur_effect_get_radius (PatchedBlurEffect *self);
void patched_blur_effect_set_radius (PatchedBlurEffect *self,
                                     float             radius);

G_END_DECLS
