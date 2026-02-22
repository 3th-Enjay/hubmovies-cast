import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { getUserId } from "@/lib/auth-helpers";
import { calculateTalentProfileCompletion, resolveTalentTier } from "@/lib/profile-completion";

/**
 * GET /api/talent/profile
 * Fetches the authenticated talent's profile
 * 
 * Returns:
 * - 200: { profile: ProfileData }
 * - 401: Unauthorized if user is not logged in
 */
export async function GET() {
  const talentId = await getUserId();
  
  if (!talentId) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  await connectDB();

  try {
    const user = await User.findById(talentId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate profile completion
    const completion = calculateTalentProfileCompletion(user);
    
    // Resolve verification tier
    const tier = resolveTalentTier(user);

    // Return profile data
    return NextResponse.json({
      profile: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        phone: user.phone,
        bio: user.bio,
        primaryRole: user.primaryRole,
        skills: user.skills || [],
        experience: user.experience || [],
        portfolio: user.portfolio || [],
        cv: user.cv || null,
        idCardFront: user.idCardFront || null,
        idCardBack: user.idCardBack || null,
        locationCity: user.locationCity || "",
        locationState: user.locationState || "",
        locationCountry: user.locationCountry || "",
        locationAddress1: user.locationAddress1 || "",
        locationAddress2: user.locationAddress2 || "",
        locationPostalCode: user.locationPostalCode || "",
        profileCompletion: completion.score,
        verificationTier: tier,
        paymentConfirmed: !!user.paymentConfirmed,
        paymentPending: !!(!user.paymentConfirmed && (user.paymentMethod || user.paymentReference)),
      },
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/talent/profile
 * Updates the authenticated talent's profile
 * 
 * Request body:
 * - name?: string
 * - image?: string
 * - phone?: string
 * - bio?: string
 * - primaryRole?: string
 * - skills?: string[]
 * - experience?: string[]
 * - portfolio?: string[]
 * 
 * Returns:
 * - 200: { profile: ProfileData } - Updated profile
 * - 401: Unauthorized if user is not logged in
 */
export async function PATCH(req: Request) {
  const talentId = await getUserId();
  
  if (!talentId) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  await connectDB();

  try {
    const body = await req.json();
    const {
      name,
      image,
      phone,
      bio,
      primaryRole,
      skills,
      experience,
      portfolio,
      cv,
      idCardFront,
      idCardBack,
      locationCity,
      locationState,
      locationCountry,
      locationAddress1,
      locationAddress2,
      locationPostalCode,
    } = body;

    const existingUser = await User.findById(talentId);
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const nextIdCardFront =
      idCardFront !== undefined ? idCardFront : existingUser.idCardFront;
    const nextIdCardBack =
      idCardBack !== undefined ? idCardBack : existingUser.idCardBack;

    if (!nextIdCardFront || !nextIdCardBack) {
      return NextResponse.json(
        { error: "Means of identification is required. Upload ID front and back images." },
        { status: 400 }
      );
    }

    // Update user fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (primaryRole !== undefined) updateData.primaryRole = primaryRole;
    if (skills !== undefined) updateData.skills = skills;
    if (experience !== undefined) updateData.experience = experience;
    if (portfolio !== undefined) updateData.portfolio = portfolio;
    if (cv !== undefined) updateData.cv = cv;
    if (idCardFront !== undefined) updateData.idCardFront = idCardFront;
    if (idCardBack !== undefined) updateData.idCardBack = idCardBack;
    if (locationCity !== undefined) updateData.locationCity = locationCity;
    if (locationState !== undefined) updateData.locationState = locationState;
    if (locationCountry !== undefined) updateData.locationCountry = locationCountry;
    if (locationAddress1 !== undefined) updateData.locationAddress1 = locationAddress1;
    if (locationAddress2 !== undefined) updateData.locationAddress2 = locationAddress2;
    if (locationPostalCode !== undefined) updateData.locationPostalCode = locationPostalCode;

    // Update user
    const user = await User.findByIdAndUpdate(
      talentId,
      updateData,
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Recalculate profile completion
    const completion = calculateTalentProfileCompletion(user);
    user.profileCompletion = completion.score;
    
    // Resolve verification tier
    const tier = resolveTalentTier(user);
    user.verificationTier = tier;
    
    await user.save();

    // Return updated profile
    return NextResponse.json({
      profile: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        phone: user.phone,
        bio: user.bio,
        primaryRole: user.primaryRole,
        skills: user.skills || [],
        experience: user.experience || [],
        portfolio: user.portfolio || [],
        cv: user.cv || null,
        idCardFront: user.idCardFront || null,
        idCardBack: user.idCardBack || null,
        locationCity: user.locationCity || "",
        locationState: user.locationState || "",
        locationCountry: user.locationCountry || "",
        locationAddress1: user.locationAddress1 || "",
        locationAddress2: user.locationAddress2 || "",
        locationPostalCode: user.locationPostalCode || "",
        profileCompletion: completion.score,
        verificationTier: tier,
        paymentConfirmed: !!user.paymentConfirmed,
        paymentPending: !!(!user.paymentConfirmed && (user.paymentMethod || user.paymentReference)),
      },
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}



